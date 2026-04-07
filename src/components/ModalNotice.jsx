
export default function ModalNotice({ notice, onClose }) {
  if (!notice) return null

  return (
    <div className="modal-backdrop modal-backdrop-front">
      <div className={`panel modal-card notice-modal ${notice.type || 'info'}`}>
        <div className="notice-icon">{notice.type === 'success' ? '✓' : notice.type === 'error' ? '!' : 'i'}</div>
        <h3>{notice.title || 'Notice'}</h3>
        <p className="subtle-copy">{notice.message}</p>
        <div className="modal-footer notice-footer">
          <button type="button" className="primary-button" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  )
}
