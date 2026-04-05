
import { useEffect, useState } from 'react'

export default function ResolveLinkModal({ open, context, onClose, onSubmit, submitting }) {
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open || !context) return
    setUrl(context.currentUrl || '')
    setNotes('')
  }, [open, context])

  if (!open || !context) return null

  return (
    <div className="modal-backdrop modal-backdrop-front">
      <div className="panel modal-card request-modal">
        <div className="modal-header">
          <h2>Fix and resolve link issue</h2>
          <p className="subtle-copy">
            {context.wrestlerName} · {context.attireName}
          </p>
        </div>

        <label>
          Replacement / corrected download URL
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/mod-download"
          />
        </label>

        <label>
          Resolution notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional note about the new link or what was fixed."
          />
        </label>

        <div className="modal-footer">
          <button className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={() => onSubmit(url, notes)} disabled={submitting || !url.trim()}>
            {submitting ? 'Saving…' : 'Save and resolve'}
          </button>
        </div>
      </div>
    </div>
  )
}
