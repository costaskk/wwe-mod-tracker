
import { formatDate } from '../lib/utils'

export default function ProfileCollections({ session, collections, onCreate, onEdit, onDelete, onOpen, onShare, sectionId }) {
  return (
    <section className="panel soft-panel" id={sectionId}>
      <div className="panel-header with-actions">
        <div>
          <h2>My collections</h2>
          <p className="subtle-copy">Curate themed packs, keep private notes, or share a public collection URL.</p>
        </div>
        <button className="primary-button small-btn" onClick={onCreate} disabled={!session}>Create collection</button>
      </div>

      {!session ? (
        <div className="empty-state small-empty">Sign in to create personal collections and share them with others.</div>
      ) : collections.length === 0 ? (
        <div className="empty-state small-empty">You do not have any collections yet.</div>
      ) : (
        <div className="collection-grid">
          {collections.map((collection) => (
            <article className="collection-card" key={collection.id}>
              {collection.cover_url ? <img className="collection-cover" src={collection.cover_url} alt={collection.name} /> : <div className="collection-cover collection-cover-placeholder">{collection.name.slice(0,2).toUpperCase()}</div>}
              <div className="collection-body">
                <div className="collection-head-row">
                  <h3>{collection.name}</h3>
                  <span className="pill">{collection.visibility}</span>
                </div>
                <div className="muted-text small-text">{collection.items?.length || 0} items · Updated {formatDate(collection.updated_at)}</div>
                {collection.description ? <p className="collection-description">{collection.description}</p> : null}
                <div className="collection-actions wrap-actions">
                  <button className="secondary-button small-btn" onClick={() => onOpen(collection)}>Browse</button>
                  {collection.visibility === 'public' ? <button className="ghost-button small-btn" onClick={() => onShare(collection)}>Share</button> : null}
                  <button className="ghost-button small-btn" onClick={() => onEdit(collection)}>Edit</button>
                  <button className="ghost-button small-btn" onClick={() => onDelete(collection)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
