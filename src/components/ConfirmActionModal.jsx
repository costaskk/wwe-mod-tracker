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
  if (!open) return null

  return (
    <div className="modal-backdrop modal-backdrop-front">
      <div className={`panel modal-card notice-modal confirm-modal ${tone}`}>
        <div className="notice-icon">
          {tone === 'danger' ? '!' : '?'}
        </div>

        <div className="modal-header">
          <h2>{title}</h2>
          <p className="subtle-copy">{message}</p>
        </div>

        <div className="modal-footer notice-footer">
          <button className="ghost-button" type="button" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            className={tone === 'danger' ? 'primary-button danger-button' : 'primary-button'}
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