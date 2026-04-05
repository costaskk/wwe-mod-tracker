import { ChevronDown, ChevronUp, Edit3, Trash2 } from 'lucide-react'

export default function ModList({
  filteredMods,
  selectedId,
  setSelectedId,
  expandedCards,
  toggleExpanded,
  onEdit,
  onDelete,
}) {
  return (
    <section className="panel mod-list-panel">
      <div className="section-heading">
        <div>
          <h2>Mod list</h2>
          <p className="muted">
            {filteredMods.length} result{filteredMods.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="mod-list-scroll">
        {filteredMods.length === 0 ? (
          <div className="empty-box">No entries match your filters.</div>
        ) : (
          filteredMods.map((mod) => {
            const isSelected = selectedId === mod.id
            const expanded = expandedCards[mod.id]
            const missingCount = Math.max(0, mod.targetAttireCount - mod.attires.length)

            return (
              <article
                className={`mod-list-card ${isSelected ? 'selected' : ''}`}
                key={mod.id}
                onClick={() => setSelectedId(mod.id)}
              >
                <div className="mod-list-card-top">
                  <div>
                    <h3>{mod.wrestlerName}</h3>
                    <p className="muted small-text">{mod.modCreator || 'Unknown creator'}</p>
                  </div>
                  <div className="badge-stack right">
                    <span className="badge badge-bright">{mod.modType}</span>
                    <span className="badge">{mod.sourceGame}</span>
                  </div>
                </div>

                <div className="meta-row small-text">
                  <span>{mod.attires.length} attire{mod.attires.length === 1 ? '' : 's'}</span>
                  <span>•</span>
                  <span>v{mod.gameVersion}</span>
                  <span>•</span>
                  <span>{mod.isMissingTarget ? 'Missing target' : 'Tracked'}</span>
                  {missingCount > 0 && (
                    <>
                      <span>•</span>
                      <span>{missingCount} attire gap</span>
                    </>
                  )}
                </div>

                {expanded && (
                  <div className="expanded-box">
                    {mod.tags.length > 0 && (
                      <div className="badge-stack">
                        {mod.tags.map((tag) => (
                          <span className="badge" key={tag}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {mod.notes && <p className="muted small-text">{mod.notes}</p>}
                  </div>
                )}

                <div className="card-actions-row">
                  <button
                    className="text-button"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleExpanded(mod.id)
                    }}
                  >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {expanded ? 'Less' : 'More'}
                  </button>

                  <div className="button-row compact">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onEdit(mod)
                      }}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onDelete(mod.id)
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
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
