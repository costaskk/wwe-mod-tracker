import { formatDate, getOtherModSubtypeLabel } from '../lib/utils'

function Toggle({ value, onChange, options }) {
  return (
    <div className="view-toggle">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={value === opt.value ? 'active' : ''}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function buildPageNumbers(page, totalPages) {
  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)

  for (let i = start; i <= end; i += 1) {
    pages.push(i)
  }

  return pages
}

export default function OtherModList({
  otherMods,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAddOtherMod,
  session,
  canContribute,
  canManageContent,
  viewMode,
  setViewMode,
  pagination,
  onPageChange
}) {
  const pageStart = pagination ? (pagination.page - 1) * pagination.perPage + 1 : 0
  const pageEnd = pagination
    ? Math.min(pagination.page * pagination.perPage, pagination.totalItems)
    : otherMods.length

  const pageNumbers = pagination ? buildPageNumbers(pagination.page, pagination.totalPages) : []

  return (
    <section className="panel soft-panel list-panel">
      <div className="panel-header with-actions">
        <div>
          <h2>Other mods</h2>
          <p className="subtle-copy">
            {pagination
              ? `${pagination.totalItems} total · showing ${pagination.totalItems ? pageStart : 0}-${pageEnd}`
              : `${otherMods.length} visible`}
          </p>
        </div>

        <div className="wrap-actions">
          {canContribute ? (
            <button
              className="primary-button small-btn"
              onClick={onAddOtherMod}
              type="button"
            >
              Add mod
            </button>
          ) : null}

          <Toggle
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'cards', label: 'Cards' },
              { value: 'table', label: 'Table' }
            ]}
          />
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="wrestler-table-wrap">
          <table className="wrestler-table">
            <thead>
              <tr>
                <th>Mod</th>
                <th>Subtype</th>
                <th>Screens</th>
                <th>Requests</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {otherMods.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty">
                    <div>No mods match the current filters.</div>
                    {canContribute ? (
                      <div className="empty-state-action">
                        <button
                          className="primary-button small-btn"
                          onClick={onAddOtherMod}
                          type="button"
                        >
                          Add mod
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ) : (
                otherMods.map((mod) => {
                  const openRequests = (mod.requests || []).filter((r) => r.status === 'open').length
                  const imageCount = mod.images?.length || mod.other_mod_images?.length || 0
                  const isSelected = mod.id === selectedId

                  const previewImage = (mod.images || mod.other_mod_images || [])[0]
                  const previewUrl =
                    previewImage?.url ||
                    previewImage?.image_url ||
                    ''

                  return (
                    <tr
                      key={mod.id}
                      className={isSelected ? 'selected-row' : ''}
                      onClick={() => onSelect(mod.id)}
                    >
                      <td>
                        <div className="table-wrestler-cell">
                          {previewUrl ? (
                            <img className="table-thumb" src={previewUrl} alt={mod.name} />
                          ) : (
                            <div className="table-thumb placeholder-thumb">
                              {(mod.name || '?').slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div className="table-wrestler-copy">
                            <strong>{mod.name || 'Unknown mod'}</strong>
                            <div className="table-wrestler-sub">
                              {mod.creator_name || 'Unknown creator'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>{getOtherModSubtypeLabel(mod.subtype || '')}</td>
                      <td>{imageCount}</td>
                      <td>{openRequests}</td>

                      <td>
                        <span className="muted-text">
                          {formatDate(mod.updated_at)}
                        </span>
                      </td>

                      <td>
                        {session && canManageContent(mod.owner_id) ? (
                          <div
                            className="list-card-actions compact-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="ghost-button inline-btn small-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEdit(mod)
                              }}
                              type="button"
                            >
                              Edit
                            </button>

                            <button
                              className="ghost-button inline-btn small-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete?.(mod)
                              }}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={`list-scroll ${otherMods.length === 1 ? 'one-item' : ''}`}>
          {otherMods.length === 0 ? (
            <div className="empty-state small-empty">
              <div>No mods match the current filters.</div>
              {canContribute ? (
                <button
                  className="primary-button small-btn"
                  onClick={onAddOtherMod}
                  type="button"
                >
                  Add mod
                </button>
              ) : null}
            </div>
          ) : (
            otherMods.map((mod) => {
              const isSelected = mod.id === selectedId
              const openRequests = (mod.requests || []).filter((r) => r.status === 'open').length
              const imageCount = mod.images?.length || mod.other_mod_images?.length || 0

              const previewImage = (mod.images || mod.other_mod_images || [])[0]
              const previewUrl =
                previewImage?.url ||
                previewImage?.image_url ||
                ''

              return (
                <div
                  key={mod.id}
                  className={`list-card wrestler-list-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelect(mod.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(mod.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="list-card-top with-thumb">
                    <div className="list-thumb-wrap">
                      {previewUrl ? (
                        <img className="list-thumb" src={previewUrl} alt={mod.name} />
                      ) : (
                        <div className="list-thumb placeholder-thumb">
                          {(mod.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="list-main-copy">
                      <div className="list-title">{mod.name || 'Unknown mod'}</div>
                      <div className="small-text muted-text">
                        {getOtherModSubtypeLabel(mod.subtype || '')} · Updated {formatDate(mod.updated_at)}
                      </div>
                    </div>
                  </div>

                  <div className="list-meta wrap-meta">
                    <span>{imageCount} screenshot{imageCount === 1 ? '' : 's'}</span>
                    <span>{openRequests} open request{openRequests === 1 ? '' : 's'}</span>
                  </div>

                  {session && canManageContent(mod.owner_id) ? (
                    <div className="list-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="ghost-button inline-btn small-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(mod)
                        }}
                        type="button"
                      >
                        Edit
                      </button>

                      <button
                        className="ghost-button inline-btn small-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete?.(mod)
                        }}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <div className="pagination-row">
          <button
            className="ghost-button small-btn"
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Previous
          </button>

          <div className="pagination-pages">
            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                className={`ghost-button small-btn ${p === pagination.page ? 'active-page' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            className="ghost-button small-btn"
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  )
}