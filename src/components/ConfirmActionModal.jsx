import { useEffect } from 'react'

export default function ConfirmActionModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onClose
}) {
  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busy) {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, busy, onClose])

  if (!open) return null

  const isDanger = tone === 'danger'
  const icon = isDanger ? '⚠' : '?'
  const titleText = title || 'Are you sure?'
  const messageText = message || 'Please confirm this action.'
  const confirmButtonClass = isDanger
    ? 'primary-button danger-button'
    : 'primary-button'

  return (
    <div
      className="modal-backdrop modal-backdrop-front"
      onClick={!busy ? onClose : undefined}
    >
      <div
        className={`panel modal-card notice-modal confirm-modal confirm-modal-${tone}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        aria-describedby="confirm-action-message"
      >
        <div className={`notice-icon confirm-notice-icon ${tone}`}>
          {icon}
        </div>

        <div className="modal-header confirm-modal-header">
          <h2 id="confirm-action-title">{titleText}</h2>
          <p className="subtle-copy" id="confirm-action-message">
            {messageText}
          </p>

          {isDanger ? (
            <p className="muted-text small-text confirm-warning-text">
              This action cannot be undone.
            </p>
          ) : null}
        </div>

        <div className="modal-footer notice-footer confirm-modal-footer">
          <button
            className="ghost-button"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            {cancelLabel}
          </button>

          <button
            className={confirmButtonClass}
            type="button"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}