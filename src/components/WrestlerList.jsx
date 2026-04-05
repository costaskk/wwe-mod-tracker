
import { formatDate } from '../lib/utils'

function Toggle({ value, onChange, options }) {
  return (
    <div className="view-toggle">
      {options.map((opt) => (
        <button key={opt.value} type="button" className={value === opt.value ? 'active' : ''} onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function WrestlerList({ wrestlers, selectedId, onSelect, onEdit, onDelete, session, viewMode, setViewMode }) {
  return (
    <section className="panel soft-panel list-panel">
      <div className="panel-header with-actions">
        <div>
          <h2>Wrestlers</h2>
          <p className="subtle-copy">{wrestlers.length} visible</p>
        </div>
        <Toggle
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'cards', label: 'Cards' },
            { value: 'table', label: 'Table' }
          ]}
        />
      </div>

      {viewMode === 'table' ? (
        <div className="wrestler-table-wrap">
          <table className="wrestler-table">
            <thead>
              <tr>
                <th>Wrestler</th>
                <th>Attires</th>
                <th>Requests</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {wrestlers.length === 0 ? (
                <tr><td colSpan="5" className="table-empty">No wrestlers match the current filters.</td></tr>
              ) : wrestlers.map((wrestler) => {
                const openRequests = (wrestler.requests || []).filter(item => item.status === 'open').length
                const isSelected = wrestler.id === selectedId
                return (
                  <tr key={wrestler.id} className={isSelected ? 'selected-row' : ''} onClick={() => onSelect(wrestler.id)}>
                    <td>
                      <div className="table-wrestler-cell">
                        {wrestler.headshot_url ? <img className="table-thumb" src={wrestler.headshot_url} alt={wrestler.wrestler_name} /> : <div className="table-thumb placeholder-thumb">{wrestler.wrestler_name.slice(0,2).toUpperCase()}</div>}
                        <div>
                          <strong>{wrestler.wrestler_name}</strong>
                        </div>
                      </div>
                    </td>
                    <td>{wrestler.attires?.length || 0}</td>
                    <td>{openRequests}</td>
                    <td>{formatDate(wrestler.updated_at)}</td>
                    <td>
                      {session && wrestler.owner_id === session.user.id ? (
                        <div className="list-card-actions compact-actions" onClick={(e) => e.stopPropagation()}>
                          <button className="ghost-button inline-btn small-btn" onClick={() => onEdit(wrestler)}>Edit</button>
                          <button className="ghost-button inline-btn small-btn" onClick={() => onDelete(wrestler)}>Delete</button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="list-scroll">
          {wrestlers.length === 0 ? (
            <div className="empty-state small-empty">No wrestlers match the current filters.</div>
          ) : wrestlers.map((wrestler) => {
            const isSelected = wrestler.id === selectedId
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
                </div>

                <div className="list-meta wrap-meta">
                  <span>{wrestler.attires?.length || 0} attire mods</span>
                  <span>{openRequests} open requests</span>
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
      )}
    </section>
  )
}
