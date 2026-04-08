export default function CollectionPickerModal({
  open,
  item,
  collections,
  memberships,
  onClose,
  onToggle,
  saving
}) {
  const selected = new Set(memberships || [])

  if (!open || !item) return null

  const itemTypeLabel =
    item.modType === 'arena'
      ? 'Arena'
      : item.modType === 'attire'
        ? 'Attire'
        : 'Item'

  return (
    <div className="modal-backdrop modal-backdrop-front">
      <div className="panel modal-card request-modal">
        <div className="modal-header">
          <h2>Save to collection</h2>
          <p className="subtle-copy">
            {item.name} · {itemTypeLabel}
          </p>
        </div>

        {collections.length === 0 ? (
          <div className="empty-state small-empty">
            <div>No collections yet.</div>
            <div className="muted-text small-text">
              Create a collection first, then return here to save this {itemTypeLabel.toLowerCase()}.
            </div>
          </div>
        ) : (
          <div className="collection-picker-list">
            {collections.map((collection) => {
              const isIn = selected.has(collection.id)
              const itemCount = (collection.items || []).length

              return (
                <div
                  key={collection.id}
                  className={`picker-row ${isIn ? 'picker-row-active' : ''}`}
                >
                  <div>
                    <strong>{collection.name}</strong>

                    <div className="muted-text small-text">
                      <span className="pill subtle-pill">
                        {collection.visibility === 'private' ? 'Private' : 'Public'}
                      </span>
                      {' '}
                      {itemCount} item{itemCount === 1 ? '' : 's'}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={isIn ? 'primary-button small-btn' : 'secondary-button small-btn'}
                    onClick={() => onToggle(collection, isIn)}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : isIn ? 'Remove' : 'Add'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="modal-footer">
          <button
            className="ghost-button"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}