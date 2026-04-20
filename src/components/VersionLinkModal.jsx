import { useEffect, useMemo, useState } from 'react'
import { SOURCE_GAMES, getModTypeLabel, getOtherModSubtypeLabel } from '../lib/utils'

function normalizeDownloadValue(value = '') {
  return String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (/^https?:\/\//i.test(item) ? item : `https://${item}`))
    .join('\n')
}

function getContextLabel(context = {}) {
  if (context.modType === 'attire') {
    return context.parentName ? `${context.itemName} · ${context.parentName}` : context.itemName
  }

  if (context.modType === 'other') {
    const subtype = context.subtype ? ` · ${getOtherModSubtypeLabel(context.subtype)}` : ''
    return `${context.itemName || 'Unknown other mod'}${subtype}`
  }

  return context.itemName || `Unknown ${getModTypeLabel(context.modType || '').toLowerCase()}`
}

export default function VersionLinkModal({
  open,
  context,
  onClose,
  onSubmit,
  submitting
}) {
  const [sourceGame, setSourceGame] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [notes, setNotes] = useState('')

  const availableGames = useMemo(() => {
    const currentGame = String(context?.currentGame || '').trim()
    const requestedGame = String(context?.requestedGame || '').trim()
    const preferred = requestedGame || ''

    const games = SOURCE_GAMES.filter((game) => game && game !== 'Other' && game !== currentGame)

    if (preferred && !games.includes(preferred)) {
      return [preferred, ...games]
    }

    return games
  }, [context])

  useEffect(() => {
    if (!open || !context) {
      setSourceGame('')
      setDownloadUrl('')
      setNotes('')
      return
    }

    setSourceGame(context.requestedGame || availableGames[0] || '')
    setDownloadUrl(context.prefillDownloadUrl || '')
    setNotes(context.prefillNotes || '')
  }, [open, context, availableGames])

  if (!open || !context) return null

  return (
    <div className="modal-backdrop modal-backdrop-front" onClick={onClose}>
      <div className="panel modal-card request-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Add port / version link</h2>
          <p className="subtle-copy">{getContextLabel(context)}</p>
        </div>

        <div className="form-grid">
          <label>
            Base game
            <input value={context.currentGame || 'Unknown game'} disabled readOnly />
          </label>

          <label>
            Version game
            <select value={sourceGame} onChange={(event) => setSourceGame(event.target.value)} disabled={submitting}>
              {availableGames.map((game) => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </select>
          </label>

          <label>
            Download links
            <textarea
              value={downloadUrl}
              onChange={(event) => setDownloadUrl(event.target.value)}
              placeholder={'One link per line\nhttps://www.mediafire.com/...\nhttps://mega.nz/...'}
            />
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional note about the port, backport, or compatibility."
            />
          </label>
        </div>

        <div className="modal-footer">
          <button className="ghost-button" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>

          <button
            className="primary-button"
            type="button"
            onClick={() => onSubmit({ sourceGame, downloadUrl: normalizeDownloadValue(downloadUrl), notes: notes.trim(), requestId: context.requestId || null })}
            disabled={submitting || !sourceGame || !String(downloadUrl || '').trim()}
          >
            {submitting ? 'Saving…' : 'Save version link'}
          </button>
        </div>
      </div>
    </div>
  )
}
