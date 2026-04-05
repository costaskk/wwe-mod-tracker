import { formatDate } from '../lib/utils'

export default function WrestlerList({ wrestlers, selectedId, onSelect, onEdit, onDelete, session }) {
  return (
    <section className="panel soft-panel list-panel">
      <div className="panel-header">
        <div>
          <h2>Wrestlers</h2>
          <p className="subtle-copy">{wrestlers.length} visible</p>
        </div>
      </div>

      <div className="list-scroll">
        {wrestlers.length === 0 ? (
          <div className="empty-state small-empty">No wrestlers match the current filters.</div>
        ) : wrestlers.map((wrestler) => {
          const isSelected = wrestler.id === selectedId
          const gap = Math.max(0, (wrestler.target_attire_count || 0) - (wrestler.attires?.length || 0))
          const openRequests = (wrestler.requests || []).filter(item => item.status === 'open').length
          const hasHeadshot = Boolean(wrestler.headshot_url)

          return (
            <button
              type="button"
              key={wrestler.id}
              className={`list-card wrestler-list-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(wrestler.id)}
            >
              <div className="list-card-top with-thumb">
                <div className="list-thumb-wrap">
                  {hasHeadshot ? <img className="list-thumb" src={wrestler.headshot_url} alt={wrestler.wrestler_name} /> : <div className="list-thumb placeholder-thumb">{wrestler.wrestler_name.slice(0, 2).toUpperCase()}</div>}
                </div>
                <div className="list-main-copy">
                  <div className="list-title">{wrestler.wrestler_name}</div>
                  <div className="small-text muted-text">Updated {formatDate(wrestler.updated_at)}</div>
                </div>
                <div className="tag-cluster">
                  {wrestler.is_missing_target ? <span className="pill danger-pill">Wanted</span> : null}
                  {gap > 0 ? <span className="pill">{gap} missing</span> : null}
                </div>
              </div>

              <div className="list-meta wrap-meta">
                <span>{wrestler.attires?.length || 0} attire mods</span>
                <span>{openRequests} open requests</span>
                <span>Target {wrestler.target_attire_count || 0}</span>
              </div>

              {session && wrestler.owner_id === session.user.id ? (
                <div className="list-card-actions">
                  <span className="ghost-button inline-btn small-btn" onClick={(e) => { e.stopPropagation(); onEdit(wrestler) }}>Edit</span>
                  <span className="ghost-button inline-btn small-btn" onClick={(e) => { e.stopPropagation(); onDelete(wrestler) }}>Delete</span>
                </div>
              ) : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}
