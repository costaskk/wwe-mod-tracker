import { formatDate } from '../lib/utils'

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

export default function ArenaList({
  arenas,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAddArena,
  session,
  canContribute,
  canManageContent,
  viewMode,
  setViewMode,
  pagination,
  onPageChange
}) {
  const pageStart = pagination ? (pagination.page - 1) * pagination.perPage + 1 : 0
  const pageEnd = pagination ? Math.min(pagination.page * pagination.perPage, pagination.totalItems) : arenas.length
  const pageNumbers = pagination ? buildPageNumbers(pagination.page, pagination.totalPages) : []

  return (
    <section className="panel soft-panel list-panel">
      <div className="panel-header with-actions">
        <div>
            <h2>Arenas</h2>
            <p className="subtle-copy">
            {pagination
                ? `${pagination.totalItems} total · showing ${pagination.totalItems ? pageStart : 0}-${pageEnd}`
                : `${arenas.length} visible`}
            </p>
        </div>

        <div className="wrap-actions">
            {canContribute ? (
            <button
                className="primary-button small-btn"
                onClick={onAddArena}
                type="button"
            >
                Add arena
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
                <th>Arena</th>
                <th>Screens</th>
                <th>Requests</th>
                <th>Updated</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {arenas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-empty">
                    <div>No arenas match the current filters.</div>
                    {canContribute ? (
                        <div className='empty-state-action'>
                        <button
                            className="primary-button small-btn"
                            onClick={onAddArena}
                            type="button"
                        >
                            Add arena
                        </button>
                        </div>
                    ) : null}
                   </td>
                </tr>
              ) : (
                arenas.map((arena) => {
                  const openRequests = (arena.requests || []).filter((item) => item.status === 'open').length
                  const imageCount = arena.images?.length || arena.arena_images?.length || 0
                  const isSelected = arena.id === selectedId
                  const previewImage = (arena.images || arena.arena_images || [])[0]
                  const previewUrl =
                    previewImage?.thumb_url ||
                    previewImage?.image_thumb_url ||
                    previewImage?.url ||
                    previewImage?.image_url ||
                    previewImage?.medium_url ||
                    previewImage?.image_medium_url ||
                    previewImage?.full_image_url ||
                    ''

                  return (
                    <tr
                      key={arena.id}
                      className={isSelected ? 'selected-row' : ''}
                      onClick={() => onSelect(arena.id)}
                    >
                      <td>
                        <div className="table-wrestler-cell">
                          {previewUrl ? (
                            <img className="table-thumb" src={previewUrl} alt={arena.name} />
                          ) : (
                            <div className="table-thumb placeholder-thumb">
                              {(arena.name || '?').slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div className="table-wrestler-copy">
                            <strong>{arena.name || 'Unknown arena'}</strong>
                            <div className="table-wrestler-sub">
                              {arena.creator_name || 'Unknown creator'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{imageCount}</td>
                      <td>{openRequests}</td>
                      <td>
                        <span className="muted-text">{formatDate(arena.updated_at)}</span>
                      </td>
                      <td>
                        {session && canManageContent(arena.owner_id) ? (
                          <div className="list-card-actions compact-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="ghost-button inline-btn small-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEdit(arena)
                              }}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="ghost-button inline-btn small-btn"
                              onClick={(e) => {
                                e.stopPropagation()  
                                onDelete?.(arena)
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
        <div className={`list-scroll ${arenas.length === 1 ? 'one-item' : ''}`}>
          {arenas.length === 0 ? (
            <div className="empty-state small-empty">
                <div>No arenas match the current filters.</div>
                {canContribute ? (
                    <button
                    className="primary-button small-btn"
                    onClick={onAddArena}
                    type="button"
                    >
                    Add arena
                    </button>
                ) : null}
            </div>
          ) : (
            arenas.map((arena) => {
              const isSelected = arena.id === selectedId
              const openRequests = (arena.requests || []).filter((item) => item.status === 'open').length
              const imageCount = arena.images?.length || arena.arena_images?.length || 0
              const previewImage = (arena.images || arena.arena_images || [])[0]
              const previewUrl =
                previewImage?.thumb_url ||
                previewImage?.image_thumb_url ||
                previewImage?.url ||
                previewImage?.image_url ||
                previewImage?.medium_url ||
                previewImage?.image_medium_url ||
                previewImage?.full_image_url ||
                ''
              const hasPreview = Boolean(previewUrl)

              return (
                <div
                  key={arena.id}
                  className={`list-card wrestler-list-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelect(arena.id)}
                  onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(arena.id)
                        }
                    }}
                    role="button"
                    tabIndex={0}
                >
                  <div className="list-card-top with-thumb">
                    <div className="list-thumb-wrap">
                      {hasPreview ? (
                        <img className="list-thumb" src={previewUrl} alt={arena.name} />
                      ) : (
                        <div className="list-thumb placeholder-thumb">
                          {(arena.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="list-main-copy">
                      <div className="list-title">{arena.name || 'Unknown arena'}</div>
                      <div className="small-text muted-text">
                        {arena.creator_name || 'Unknown creator'} · Updated {formatDate(arena.updated_at)}
                      </div>
                    </div>
                  </div>

                  <div className="list-meta wrap-meta">
                    <span>{imageCount} screenshot{imageCount === 1 ? '' : 's'}</span>
                    <span>{openRequests} open request{openRequests === 1 ? '' : 's'}</span>
                  </div>

                  {session && canManageContent(arena.owner_id) ? (
                    <div className="list-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="ghost-button inline-btn small-btn"
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit(arena)
                        }}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="ghost-button inline-btn small-btn"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete?.(arena)
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
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            type="button"
          >
            Previous
          </button>

          <div className="pagination-pages">
            {pagination.page > 3 ? (
              <>
                <button
                  className="ghost-button small-btn page-number-btn"
                  type="button"
                  onClick={() => onPageChange(1)}
                >
                  1
                </button>
                <span className="pagination-ellipsis">…</span>
              </>
            ) : null}

            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`ghost-button small-btn page-number-btn ${pageNumber === pagination.page ? 'active-page' : ''}`}
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}

            {pagination.page < pagination.totalPages - 2 ? (
              <>
                <span className="pagination-ellipsis">…</span>
                <button
                  className="ghost-button small-btn page-number-btn"
                  type="button"
                  onClick={() => onPageChange(pagination.totalPages)}
                >
                  {pagination.totalPages}
                </button>
              </>
            ) : null}
          </div>

          <button
            className="ghost-button small-btn"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  )
}