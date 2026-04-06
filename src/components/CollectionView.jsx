
import { formatDate, titleCase } from '../lib/utils'

export default function CollectionView({ collection, session, canContribute, onClose, onSelectWrestler }) {
  if (!collection) return null

  return (
    <section className="panel detail-hero collection-view-panel">
      <div className="panel-header with-actions">
        <div>
          <div className="eyebrow">Collection page</div>
          <h2>{collection.name}</h2>
          <p className="subtle-copy">{collection.description || 'No description added yet.'}</p>
        </div>
        <button className="ghost-button" onClick={onClose} type="button">Back to collections</button>
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
            <div><span>Visibility</span><strong>{titleCase(collection.visibility)}</strong></div>
            <div><span>Items</span><strong>{collection.items?.length || 0}</strong></div>
            <div><span>Updated</span><strong>{formatDate(collection.updated_at)}</strong></div>
          </div>
        </div>
      </div>

      <div className="collection-items-grid">
        {(collection.items || []).length === 0 ? (
          <div className="empty-state small-empty">This collection has no items yet.</div>
        ) : (
          collection.items.map((item) => {
            const attire = item.attire || item.attires
            const wrestler = attire?.wrestler
            const image = attire?.attire_images?.[0]

            return (
              <article className="collection-item-card" key={item.id}>
                {image?.image_url ? (
                  <img className="collection-item-thumb" src={image.image_url} alt={attire?.name || 'Attire'} />
                ) : (
                  <div className="collection-item-thumb collection-cover-placeholder">
                    {(attire?.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="collection-item-body">
                  <h3>{attire?.name || 'Unknown attire'}</h3>
                  <div className="muted-text small-text">
                    {wrestler?.wrestler_name || 'Unknown wrestler'} · {attire?.source_game || '—'}
                  </div>

                  {attire?.creator_name ? (
                    <div className="creator-badge prominent-creator-badge">{attire.creator_name}</div>
                  ) : null}

                  <div className="collection-actions wrap-actions">
                    {wrestler ? (
                      <button className="secondary-button small-btn" onClick={() => onSelectWrestler(wrestler.id)} type="button">
                        Open wrestler
                      </button>
                    ) : null}

                    {canContribute ? (
                      attire?.download_url ? (
                        <a className="ghost-button small-btn" href={attire.download_url} target="_blank" rel="noreferrer">
                          Download
                        </a>
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
