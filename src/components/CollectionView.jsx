import {
  formatDate,
  titleCase,
  parseDownloadLinks,
  getCollectionItemTarget,
  getModTypeLabel
} from '../lib/utils'

export default function CollectionView({ collection, canContribute, onClose, onSelectWrestler }) {
  if (!collection) return null

  return (
    <section className="panel detail-hero collection-view-panel">
      <div className="panel-header with-actions">
        <div>
          <div className="eyebrow">Collection page</div>
          <h2>{collection.name}</h2>
          <p className="subtle-copy">{collection.description || 'No description added yet.'}</p>
        </div>
        <button className="ghost-button" onClick={onClose} type="button">
          Back to collections
        </button>
      </div>

      <div className="collection-hero-grid">
        {collection.cover_url ? (
          <img className="collection-hero-cover" src={collection.cover_url} alt={collection.name} />
        ) : (
          <div className="collection-hero-cover collection-cover-placeholder">
            {collection.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="collection-hero-copy">
          <div className="mini-stats mini-stats-three">
            <div>
              <span>Visibility</span>
              <strong>{titleCase(collection.visibility)}</strong>
            </div>
            <div>
              <span>Items</span>
              <strong>{collection.items?.length || 0}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>{formatDate(collection.updated_at)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="collection-items-grid">
        {(collection.items || []).length === 0 ? (
          <div className="empty-state small-empty">This collection has no items yet.</div>
        ) : (
          collection.items.map((item) => {
            const target = getCollectionItemTarget(item)
            const attire = item.attire || item.attires || null
            const arena = item.arena || item.arenas || null

            const isAttire = target.mod_type === 'attire'
            const isArena = target.mod_type === 'arena'

            const displayName = isAttire
              ? (attire?.name || 'Unknown attire')
              : isArena
                ? (arena?.name || 'Unknown arena')
                : 'Unknown item'

            const subtitle = isAttire
              ? `${attire?.wrestler?.wrestler_name || 'Unknown wrestler'} · ${attire?.source_game || '—'}`
              : isArena
                ? `${getModTypeLabel(target.mod_type)} · ${arena?.source_game || '—'}`
                : getModTypeLabel(target.mod_type)

            const creatorName = isAttire
              ? attire?.creator_name
              : isArena
                ? arena?.creator_name
                : ''

            const image = isAttire
              ? attire?.attire_images?.[0]
              : isArena
                ? arena?.arena_images?.[0]
                : null

            const thumbUrl = image?.image_url || image?.url || ''
            const downloadUrl = isAttire
              ? attire?.download_url
              : isArena
                ? arena?.download_url
                : ''

            return (
              <article className="collection-item-card" key={item.id}>
                {thumbUrl ? (
                  <img className="collection-item-thumb" src={thumbUrl} alt={displayName} />
                ) : (
                  <div className="collection-item-thumb collection-cover-placeholder">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="collection-item-body">
                  <h3>{displayName}</h3>

                  <div className="muted-text small-text">
                    {subtitle}
                  </div>

                  <div className="muted-text small-text">
                    {getModTypeLabel(target.mod_type)}
                  </div>

                  {creatorName ? (
                    <div className="creator-badge prominent-creator-badge">{creatorName}</div>
                  ) : null}

                  <div className="collection-actions wrap-actions">
                    {isAttire && attire?.wrestler ? (
                      <button
                        className="secondary-button small-btn"
                        onClick={() =>
                          onSelectWrestler({
                            wrestlerId: attire.wrestler.id,
                            wrestlerName: attire.wrestler.wrestler_name
                          })
                        }
                        type="button"
                      >
                        Open wrestler
                      </button>
                    ) : null}

                    {canContribute ? (
                      parseDownloadLinks(downloadUrl).length ? (
                        <span className="pill">{parseDownloadLinks(downloadUrl).length} link(s)</span>
                      ) : (
                        <span className="pill danger-pill">No link</span>
                      )
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}