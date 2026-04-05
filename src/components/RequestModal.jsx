
import { useEffect, useState } from 'react'

export default function RequestModal({ open, context, onClose, onSubmit, submitting }) {
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) setNotes('')
  }, [open])

  if (!open || !context) return null

  const title = context.requestType === 'dead_link' ? 'Report dead link' : 'Request missing link'
  const hint = context.requestType === 'dead_link'
    ? 'Add any details that help others confirm the broken link or find a replacement.'
    : 'Add any details about the missing mod or attire link you want the community to fill in.'

  return (
    <div className="modal-backdrop modal-backdrop-front">
      <div className="panel modal-card request-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <p className="subtle-copy">
            {context.wrestlerName} · {context.attireName}
          </p>
        </div>

        <label>
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={hint}
          />
        </label>

        <div className="modal-footer">
          <button className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={() => onSubmit(notes)} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>
        </div>
      </div>
    </div>
  )
}
