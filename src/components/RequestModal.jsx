import { useEffect, useState } from 'react'

export default function RequestModal({
  open,
  context,
  onClose,
  onSubmit,
  submitting
}) {
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) {
      setNotes('')
      return
    }
    setNotes(context?.prefillNotes || '')
  }, [open, context])

  if (!open || !context) return null

  const label =
    context.requestType === 'dead_link'
      ? 'Report dead link'
      : 'Request missing link'

  return (
    <div className="modal-backdrop modal-backdrop-front">
      <div className="panel modal-card request-modal">
        <div className="modal-header">
          <h2>{label}</h2>
          <p className="subtle-copy">
            {context.wrestlerName || 'Unknown wrestler'} · {context.attireName || 'Unknown attire'}
          </p>
        </div>

        <div className="form-grid">
          <label>
            Notes
            <textarea
              autoFocus
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details here..."
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
            onClick={() => onSubmit(notes.trim())}
            disabled={submitting || !notes.trim()}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}