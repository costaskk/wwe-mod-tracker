
import { useEffect, useState } from 'react'

export default function CollectionPickerModal({ open, attire, collections, memberships, onClose, onToggle, saving }) {
  const [selected, setSelected] = useState(new Set())

  useEffect(() => {
    setSelected(new Set(memberships || []))
  }, [memberships, open])

  if (!open || !attire) return null

  return (
    <div className="modal-backdrop modal-backdrop-front">
      <div className="panel modal-card request-modal">
        <div className="modal-header">
          <h2>Save to collection</h2>
          <p className="subtle-copy">{attire.name}</p>
        </div>

        {collections.length === 0 ? (
          <div className="empty-state small-empty">Create a collection first, then return here to save this attire.</div>
        ) : (
          <div className="collection-picker-list">
            {collections.map((collection) => {
              const isIn = selected.has(collection.id)
              return (
                <label key={collection.id} className="picker-row">
                  <div>
                    <strong>{collection.name}</strong>
                    <div className="muted-text small-text">{collection.visibility} · {(collection.items || []).length} items</div>
                  </div>
                  <button
                    type="button"
                    className={isIn ? 'primary-button small-btn' : 'secondary-button small-btn'}
                    onClick={() => onToggle(collection, isIn)}
                    disabled={saving}
                  >
                    {isIn ? 'Remove' : 'Add'}
                  </button>
                </label>
              )
            })}
          </div>
        )}

        <div className="modal-footer">
          <button className="ghost-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
