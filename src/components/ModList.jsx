export default function ModList({ mods, selectedId, onSelect, onEdit, onDelete }) {
  return (
    <section className="panel list-panel">
      <div className="panel-header">
        <h2>Mods</h2>
        <span className="pill">{mods.length} results</span>
      </div>

      <div className="list-scroll">
        {mods.length === 0 ? (
          <div className="empty-state small-empty">No mods found for the current filters.</div>
        ) : (
          mods.map((mod) => {
            const gap = Math.max(0, (mod.target_attire_count || 0) - (mod.attires?.length || 0))
            return (
              <button
                key={mod.id}
                type="button"
                className={`list-card ${selectedId === mod.id ? 'selected' : ''}`}
                onClick={() => onSelect(mod.id)}
              >
                <div className="list-card-top">
                  <div>
                    <div className="list-title">{mod.wrestler_name}</div>
                    <div className="muted small-text">{mod.mod_creator_name || 'Unknown creator'}</div>
                  </div>
                  <div className="tag-cluster">
                    <span className="pill dark">{mod.mod_type}</span>
                    <span className="pill dark">{mod.source_game}</span>
                  </div>
                </div>

                <div className="list-meta">
                  <span>{mod.attires?.length || 0} attires</span>
                  <span>v{mod.game_version}</span>
                  {mod.is_missing_target ? <span className="warning-text">Missing target</span> : null}
                  {gap > 0 ? <span className="warning-text">Gap: {gap}</span> : null}
                </div>

                <div className="list-card-actions">
                  <button
                    type="button"
                    className="secondary-button small-btn"
                    onClick={(event) => {
                      event.stopPropagation()
                      onEdit(mod)
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger-button small-btn"
                    onClick={(event) => {
                      event.stopPropagation()
                      onDelete(mod.id)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </button>
            )
          })
        )}
      </div>
    </section>
  )
}
