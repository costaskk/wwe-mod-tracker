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

      if (event.key === 'Enter' && !busy) {
        const tag = document.activeElement?.tagName
        const isTypingTarget =
          tag === 'TEXTAREA' ||
          tag === 'INPUT' ||
          document.activeElement?.isContentEditable

        if (!isTypingTarget) {
          event.preventDefault()
          onConfirm?.()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, busy, onConfirm, onClose])

  if (!open) return null

  const isDanger = tone === 'danger'
  const icon = isDanger ? '!' : '?'
  const titleText = title || 'Are you sure?'
  const messageText = message || 'Please confirm this action.'
  const titleId = 'confirm-action-title'
  const messageId = 'confirm-action-message'

  return (
    <div
      className="modal-backdrop modal-backdrop-front"
      onClick={busy ? undefined : () => onClose?.()}
    >
      <div
        className={`panel modal-card confirm-modal confirm-modal-${tone}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <div className={`confirm-modal-icon confirm-modal-icon-${tone}`}>
          {icon}
        </div>

        <div className="modal-header confirm-modal-header">
          <h2 id={titleId}>{titleText}</h2>

          <p className="subtle-copy" id={messageId}>
            {messageText}
          </p>

          {isDanger ? (
            <p className="muted-text small-text confirm-warning-text">
              This action cannot be undone.
            </p>
          ) : null}
        </div>

        <div className="modal-footer confirm-modal-footer">
          <button
            className="ghost-button"
            type="button"
            onClick={() => onClose?.()}
            disabled={busy}
          >
            {cancelLabel}
          </button>

          <button
            className={isDanger ? 'primary-button danger-button' : 'primary-button'}
            type="button"
            onClick={() => onConfirm?.()}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}