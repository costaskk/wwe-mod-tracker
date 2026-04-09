import { useEffect } from 'react'

export default function ModalNotice({ notice, onClose }) {
  useEffect(() => {
    if (!notice) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.()
      }

      if (event.key === 'Enter') {
        const tag = document.activeElement?.tagName
        const isTypingTarget =
          tag === 'TEXTAREA' ||
          tag === 'INPUT' ||
          document.activeElement?.isContentEditable

        if (!isTypingTarget) {
          event.preventDefault()
          onClose?.()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [notice, onClose])

  if (!notice) return null

  const tone = notice.type || 'info'
  const titleText = notice.title || 'Notice'
  const messageText = notice.message || ''
  const icon =
    tone === 'success'
      ? '✓'
      : tone === 'error'
        ? '!'
        : 'i'

  return (
    <div
      className="modal-backdrop modal-backdrop-front"
      onClick={() => onClose?.()}
    >
      <div
        className={`panel modal-card notice-modal ${tone}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-notice-title"
        aria-describedby="modal-notice-message"
      >
        <div className="notice-icon">
          {icon}
        </div>

        <div className="modal-header confirm-modal-header">
          <h2 id="modal-notice-title">{titleText}</h2>
          <p className="subtle-copy" id="modal-notice-message">
            {messageText}
          </p>
        </div>

        <div className="modal-footer notice-footer confirm-modal-footer">
          <button
            type="button"
            className="primary-button"
            onClick={() => onClose?.()}
            autoFocus
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}