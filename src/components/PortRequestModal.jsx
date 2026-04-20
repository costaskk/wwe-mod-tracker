import { useEffect, useMemo, useState } from 'react'
import { SOURCE_GAMES, getModTypeLabel, getOtherModSubtypeLabel } from '../lib/utils'

function getContextTitle(context = {}) {
  return context.itemName || context.title || context.name || 'Unknown mod'
}

function getContextSubtitle(context = {}) {
  if (context.modType === 'attire') {
    return context.parentName ? `Attire · ${context.parentName}` : 'Attire'
  }

  if (context.modType === 'arena') return 'Arena'
  if (context.modType === 'title') return 'Title belt'

  if (context.modType === 'other') {
    return context.subtype ? `Other mod · ${getOtherModSubtypeLabel(context.subtype)}` : 'Other mod'
  }

  return getModTypeLabel(context.modType || '')
}

export default function PortRequestModal({
  open,
  context,
  onClose,
  onSubmit,
  submitting
}) {
  const [requestedGame, setRequestedGame] = useState('')
  const [notes, setNotes] = useState('')

  const availableGames = useMemo(() => {
    const currentGame = String(context?.currentGame || '').trim()
    return SOURCE_GAMES.filter((game) => game && game !== 'Other' && game !== currentGame)
  }, [context])

  useEffect(() => {
    if (!open || !context) {
      setRequestedGame('')
      setNotes('')
      return
    }

    setRequestedGame(context.prefillRequestedGame || availableGames[0] || '')
    setNotes(context.prefillNotes || '')
  }, [open, context, availableGames])

  if (!open || !context) return null

  return (
    <div className="modal-backdrop modal-backdrop-front" onClick={onClose}>
      <div className="panel modal-card request-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Request a port / backport</h2>
          <p className="subtle-copy">
            <strong>{getContextTitle(context)}</strong>
            <span>{` · ${getContextSubtitle(context)}`}</span>
          </p>
        </div>

        <div className="form-grid">
          <label>
            Current game
            <input value={context.currentGame || 'Unknown game'} disabled readOnly />
          </label>

          <label>
            Requested game
            <select
              value={requestedGame}
              onChange={(event) => setRequestedGame(event.target.value)}
              disabled={submitting || !availableGames.length}
            >
              {availableGames.length ? null : <option value="">No alternative game available</option>}
              {availableGames.map((game) => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </select>
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional details about the requested version, compatibility, or what should be ported."
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
            onClick={() => onSubmit({ requestedGame, notes: notes.trim() })}
            disabled={submitting || !requestedGame}
          >
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>
        </div>
      </div>
    </div>
  )
}
