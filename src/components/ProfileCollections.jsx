import { formatDate } from '../lib/utils'

export default function ProfileCollections({
  session,
  collections = [],
  onCreate,
  onEdit,
  onDelete,
  onOpen,
  onShare,
  sectionId
}) {
  const hasCollections = collections.length > 0

  function getItemLabel(count) {
    return `${count} item${count === 1 ? '' : 's'}`
  }

  return (
    <section className="panel soft-panel" id={sectionId}>
      <div className="panel-header with-actions">
        <div>
          <h2>My collections</h2>
          <p className="subtle-copy">
            Curate themed packs, keep private notes, or share a public collection URL.
          </p>
        </div>

        <button
          className="primary-button small-btn"
          onClick={() => onCreate?.()}
          disabled={!session || !onCreate}
          type="button"
        >
          Create collection
        </button>
      </div>

      {!session ? (
        <div className="empty-state small-empty">
          <div>Sign in to create personal collections.</div>
          <div className="muted-text small-text">
            Once you are signed in, you can build private or public collections and share them with others.
          </div>
        </div>
      ) : !hasCollections ? (
        <div className="empty-state small-empty">
          <div>You do not have any collections yet.</div>
          <div className="muted-text small-text">
            Create your first collection to start organizing attire mods, arenas, and more.
          </div>
        </div>
      ) : (
        <div className="collection-grid">
          {collections.map((collection) => {
            const itemCount = collection.items?.length || 0
            const visibilityLabel = collection.visibility === 'private' ? 'Private' : 'Public'
            const canShare = collection.visibility === 'public' && !!onShare

            return (
              <article className="collection-card elevated-card" key={collection.id}>
                {collection.cover_url ? (
                  <img
                    className="collection-cover"
                    src={collection.cover_url}
                    alt={collection.name || 'Collection cover'}
                  />
                ) : (
                  <div className="collection-cover collection-cover-placeholder">
                    {(collection.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="collection-body">
                  <div className="collection-head-row">
                    <h3>{collection.name || 'Untitled collection'}</h3>
                    <span className="pill">
                      {visibilityLabel}
                    </span>
                  </div>

                  <div className="muted-text small-text">
                    {getItemLabel(itemCount)} · Updated {formatDate(collection.updated_at)}
                  </div>

                  <p className="collection-description">
                    {collection.description?.trim() || 'No description added yet.'}
                  </p>

                  <div className="collection-actions wrap-actions">
                    <button
                      className="secondary-button small-btn"
                      onClick={() => onOpen?.(collection)}
                      type="button"
                      disabled={!onOpen}
                    >
                      Browse
                    </button>

                    {canShare ? (
                      <button
                        className="ghost-button small-btn"
                        onClick={() => onShare(collection)}
                        type="button"
                      >
                        Share
                      </button>
                    ) : null}

                    <button
                      className="ghost-button small-btn"
                      onClick={() => onEdit?.(collection)}
                      type="button"
                      disabled={!onEdit}
                    >
                      Edit
                    </button>

                    {onDelete ? (
                      <button
                        className="ghost-button small-btn"
                        onClick={() => onDelete(collection)}
                        type="button"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}