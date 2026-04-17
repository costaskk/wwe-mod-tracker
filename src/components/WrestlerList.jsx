import { useEffect, useRef } from 'react'
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

export default function WrestlerList({
  wrestlers,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  session,
  canManageContent,
  viewMode,
  setViewMode,
  pagination,
  onPageChange,
  onLoadMore,
  hasMore
}) {

    const selectedRef = useRef(null)

    useEffect(() => {
      if (!selectedId) return

      const node = selectedRef.current
      if (!node) return

      node.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }, [selectedId])

    const loadMoreRef = useRef(null)

    useEffect(() => {
      if (!onLoadMore || !hasMore) return

      const node = loadMoreRef.current
      if (!node) return

      const observer = new IntersectionObserver(
        (entries) => {
          const first = entries[0]
          if (first?.isIntersecting) {
            onLoadMore()
          }
        },
        {
          root: null,
          rootMargin: '200px 0px',
          threshold: 0.1
        }
      )

      observer.observe(node)

      return () => observer.disconnect()
    }, [onLoadMore, hasMore, wrestlers.length])

  const pageStart = pagination?.page && pagination?.perPage
    ? (pagination.page - 1) * pagination.perPage + 1
    : wrestlers.length ? 1 : 0

  const pageEnd = pagination?.page && pagination?.perPage && pagination?.totalItems
    ? Math.min(pagination.page * pagination.perPage, pagination.totalItems)
    : wrestlers.length
  const pageNumbers =
    pagination?.page && pagination?.totalPages
      ? buildPageNumbers(pagination.page, pagination.totalPages)
      : []

  return (
    <section className="panel soft-panel list-panel">
      <div className="panel-header with-actions">
        <div>
          <h2>Wrestlers</h2>
          <p className="subtle-copy">
            {pagination
              ? `${pagination.totalItems} total · showing ${pagination.totalItems ? pageStart : 0}-${pageEnd}`
              : `${wrestlers.length} visible`}
          </p>
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
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {wrestlers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-empty">No wrestlers match the current filters.</td>
                </tr>
              ) : (
                wrestlers.map((wrestler) => {
                  const openRequests = (wrestler.requests || []).filter((item) => item.status === 'open').length
                  const isSelected = wrestler.id === selectedId
                  const attireCount = wrestler.attires?.length || 0

                  return (
                    <tr
                      key={wrestler.id}
                      ref={isSelected ? selectedRef : null}
                      className={isSelected ? 'selected-row' : ''}
                      onClick={() => {
                        onSelect(wrestler.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelect(wrestler.id)
                        }
                      }}
                      tabIndex={0}
                      aria-selected={isSelected}
                    >
                      <td>
                        <div className="table-wrestler-cell">
                          {wrestler.headshot_url ? (
                            <img className="table-thumb" src={wrestler.headshot_url} alt={wrestler.wrestler_name} />
                          ) : (
                            <div className="table-thumb placeholder-thumb">
                              {(wrestler.wrestler_name || '?').slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div className="table-wrestler-copy">
                            <strong>{wrestler.wrestler_name || 'Unknown wrestler'}</strong>
                            <div className="table-wrestler-sub">
                              {attireCount} attire mod{attireCount === 1 ? '' : 's'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{attireCount}</td>
                      <td>{openRequests}</td>
                      <td>
                        <span className="muted-text">{formatDate(wrestler.updated_at)}</span>
                      </td>
                      <td>
                        {session && canManageContent(wrestler.owner_id) ? (
                          <div className="list-card-actions compact-actions" onClick={(e) => e.stopPropagation()}>
                            <button className="ghost-button inline-btn small-btn" onClick={() => onEdit(wrestler)} type="button">
                              Edit
                            </button>
                            <button className="ghost-button inline-btn small-btn" onClick={() => onDelete(wrestler)} type="button">
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
        <div className={`list-scroll ${wrestlers.length === 1 ? 'one-item' : ''}`}>
          {wrestlers.length === 0 ? (
            <div className="empty-state small-empty">No wrestlers match the current filters.</div>
          ) : (
            wrestlers.map((wrestler) => {
              const isSelected = wrestler.id === selectedId
              const openRequests = (wrestler.requests || []).filter((item) => item.status === 'open').length
              const attireCount = wrestler.attires?.length || 0
              const hasHeadshot = Boolean(wrestler.headshot_url)

              return (
                <div
                  key={wrestler.id}
                  ref={isSelected ? selectedRef : null}
                  className={`list-card wrestler-list-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelect(wrestler.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(wrestler.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="list-card-top with-thumb">
                    <div className="list-thumb-wrap">
                      {hasHeadshot ? (
                        <img className="list-thumb" src={wrestler.headshot_url} alt={wrestler.wrestler_name} />
                      ) : (
                        <div className="list-thumb placeholder-thumb">
                          {(wrestler.wrestler_name || '?').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="list-main-copy">
                      <div className="list-title">{wrestler.wrestler_name || 'Unknown wrestler'}</div>
                      <div className="small-text muted-text">
                        {attireCount} attire mod{attireCount === 1 ? '' : 's'} · Updated {formatDate(wrestler.updated_at)}
                      </div>
                    </div>
                  </div>

                  <div className="list-meta wrap-meta">
                    <span>{attireCount} attire mods</span>
                    <span>{openRequests} open requests</span>
                  </div>

                  {session && canManageContent(wrestler.owner_id) ? (
                    <div className="list-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="ghost-button inline-btn small-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(wrestler)
                        }}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="ghost-button inline-btn small-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(wrestler)
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
      {onLoadMore ? (
        hasMore ? (
          <div ref={loadMoreRef} className="list-load-more-trigger">
            <div className="muted-text small-text">Loading more wrestlers…</div>
          </div>
        ) : wrestlers.length > 0 ? (
          <div className="list-load-more-trigger">
            <div className="muted-text small-text">No more wrestlers to load.</div>
          </div>
        ) : null
      ) : pagination && pagination.totalPages > 1 ? (
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
                <button className="ghost-button small-btn page-number-btn" type="button" onClick={() => onPageChange(1)}>1</button>
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