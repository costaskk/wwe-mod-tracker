import { useEffect, useMemo, useState } from 'react'
import { getOtherModSubtypeLabel } from '../lib/utils'

export default function ResolveLinkModal({
  open,
  context,
  onClose,
  onSubmit,
  submitting
}) {
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) {
      setUrl('')
      setNotes('')
      return
    }

    if (!context) return

    setUrl(context.currentUrl || '')
    setNotes('')
  }, [open, context])

  const contextLabel = useMemo(() => {
    if (!context) return ''

    if (context.modCategory === 'arena') {
      return context.arenaName || 'Unknown arena'
    }

    if (context.modCategory === 'title') {
      return context.titleName || 'Unknown title belt'
    }

    if (context.modCategory === 'other') {
      const subtype = context.otherModSubtype
        ? ` · ${getOtherModSubtypeLabel(context.otherModSubtype)}`
        : ''
      return `${context.otherModName || 'Unknown other mod'}${subtype}`
    }

    return `${context.wrestlerName || 'Unknown wrestler'} · ${context.attireName || 'Unknown attire'}`
  }, [context])

  if (!open || !context) return null

  return (
    <div className="modal-backdrop modal-backdrop-front">
      <div className="panel modal-card request-modal">
        <div className="modal-header">
          <h2>Fix link</h2>
          <p className="subtle-copy">{contextLabel}</p>
        </div>

        <div className="form-grid">
          <label>
            Correct download URL
            <input
              type="url"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/mod-download"
            />
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note about the new link or what was fixed."
            />
          </label>
        </div>

        <div className="modal-footer">
          <button
            className="ghost-button"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            className="primary-button"
            type="button"
            onClick={() => onSubmit(url.trim(), notes.trim())}
            disabled={submitting || !url.trim()}
          >
            {submitting ? 'Saving…' : 'Save and resolve'}
          </button>
        </div>
      </div>
    </div>
  )
}