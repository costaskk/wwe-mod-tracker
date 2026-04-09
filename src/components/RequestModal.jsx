import { useEffect, useMemo, useState } from 'react'

function getRequestTitle(requestType = '') {
  switch (requestType) {
    case 'dead_link':
      return 'Report dead link'
    case 'missing_link':
      return 'Request missing link'
    case 'general_request':
      return 'Request update'
    default:
      return 'Submit request'
  }
}

function getContextTitle(context = {}) {
  if (context.modCategory === 'arena') {
    return context.arenaName || 'Unknown arena'
  }

  if (context.modCategory === 'title') {
    return context.titleName || 'Unknown title belt'
  }

  if (context.modCategory === 'other') {
    return context.otherModName || 'Unknown other mod'
  }

  return context.attireName || 'Unknown attire'
}

function getContextSubtitle(context = {}) {
  if (context.modCategory === 'arena') return 'Arena'
  if (context.modCategory === 'title') return 'Title belt'

  if (context.modCategory === 'other') {
    const subtype = context.otherModSubtype || ''
    return subtype ? `Other mod · ${subtype}` : 'Other mod'
  }

  return context.wrestlerName || 'Unknown wrestler'
}

function getPlaceholder(context = {}) {
  switch (context.requestType) {
    case 'dead_link':
      return 'Add details about the dead link, what failed, or which provider/link is broken.'
    case 'missing_link':
      return 'Add any helpful details about the missing link or what should be added.'
    case 'general_request':
      return 'Add details about the update or request you want submitted.'
    default:
      return 'Add details here...'
  }
}

export default function RequestModal({
  open,
  context,
  onClose,
  onSubmit,
  submitting
}) {
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open || !context) {
      setNotes('')
      return
    }

    setNotes(context.prefillNotes || '')
  }, [open, context])

  // ✅ SAFE: never pass null
  const safeContext = context || {}

  const title = useMemo(() => getRequestTitle(safeContext.requestType), [safeContext])
  const itemTitle = useMemo(() => getContextTitle(safeContext), [safeContext])
  const itemSubtitle = useMemo(() => getContextSubtitle(safeContext), [safeContext])
  const placeholder = useMemo(() => getPlaceholder(safeContext), [safeContext])

  if (!open || !context) return null

  return (
    <div className="modal-backdrop modal-backdrop-front" onClick={onClose}>
      <div
        className="panel modal-card request-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <p className="subtle-copy">
            <strong>{itemTitle}</strong>
            <span>{` · ${itemSubtitle}`}</span>
          </p>
        </div>

        <div className="form-grid">
          <label>
            Notes
            <textarea
              autoFocus
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={placeholder}
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