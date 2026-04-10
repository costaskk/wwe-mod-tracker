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

export default function TitleBeltList({
  titleBelts,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAddTitle,
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
    : titleBelts.length
  const pageNumbers = pagination ? buildPageNumbers(pagination.page, pagination.totalPages) : []

  return (
    <section className="panel soft-panel list-panel">
      <div className="panel-header with-actions">
        <div>
          <h2>Title belts</h2>
          <p className="subtle-copy">
            {pagination
              ? `${pagination.totalItems} total · showing ${pagination.totalItems ? pageStart : 0}-${pageEnd}`
              : `${titleBelts.length} visible`}
          </p>
        </div>

        <div className="wrap-actions">
          {canContribute ? (
            <button
              className="primary-button small-btn"
              onClick={onAddTitle}
              type="button"
            >
              Add title belt
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
                <th>Title belt</th>
                <th>Screens</th>
                <th>Audio</th>
                <th>Requests</th>
                <th>Updated</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {titleBelts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty">
                    <div>No title belts match the current filters.</div>
                    {canContribute ? (
                      <div className="empty-state-action">
                        <button
                          className="primary-button small-btn"
                          onClick={onAddTitle}
                          type="button"
                        >
                          Add title belt
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ) : (
                titleBelts.map((title) => {
                  const openRequests = (title.requests || []).filter((item) => item.status === 'open').length
                  const imageCount = title.images?.length || title.title_belt_images?.length || 0
                  const audioCount = title.audio_files?.length || title.title_belt_audio_files?.length || 0
                  const isSelected = title.id === selectedId

                  const previewImage = (title.images || title.title_belt_images || [])[0]
                  const previewUrl =
                    previewImage?.url ||
                    previewImage?.image_url ||
                    ''

                  return (
                    <tr
                      key={title.id}
                      className={isSelected ? 'selected-row' : ''}
                      onClick={() => onSelect(title.id)}
                    >
                      <td>
                        <div className="table-wrestler-cell">
                          {previewUrl ? (
                            <img className="table-thumb" src={previewUrl} alt={title.name} />
                          ) : (
                            <div className="table-thumb placeholder-thumb">
                              {(title.name || '?').slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div className="table-wrestler-copy">
                            <strong>{title.name || 'Unknown title belt'}</strong>
                            <div className="table-wrestler-sub">
                              {title.creator_name || 'Unknown creator'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{imageCount}</td>
                      <td>{audioCount}</td>
                      <td>{openRequests}</td>
                      <td>
                        <span className="muted-text">{formatDate(title.updated_at)}</span>
                      </td>
                      <td>
                        {session && canManageContent(title.owner_id) ? (
                          <div
                            className="list-card-actions compact-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="ghost-button inline-btn small-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEdit(title)
                              }}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="ghost-button inline-btn small-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete?.(title)
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
        <div className={`list-scroll ${titleBelts.length === 1 ? 'one-item' : ''}`}>
          {titleBelts.length === 0 ? (
            <div className="empty-state small-empty">
              <div>No title belts match the current filters.</div>
              {canContribute ? (
                <button
                  className="primary-button small-btn"
                  onClick={onAddTitle}
                  type="button"
                >
                  Add title belt
                </button>
              ) : null}
            </div>
          ) : (
            titleBelts.map((title) => {
              const isSelected = title.id === selectedId
              const openRequests = (title.requests || []).filter((item) => item.status === 'open').length
              const imageCount = title.images?.length || title.title_belt_images?.length || 0
              const audioCount = title.audio_files?.length || title.title_belt_audio_files?.length || 0

              const previewImage = (title.images || title.title_belt_images || [])[0]
              const previewUrl =
                previewImage?.url ||
                previewImage?.image_url ||
                ''

              const hasPreview = Boolean(previewUrl)

              return (
                <div
                  key={title.id}
                  className={`list-card wrestler-list-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelect(title.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(title.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="list-card-top with-thumb">
                    <div className="list-thumb-wrap">
                      {hasPreview ? (
                        <img className="list-thumb" src={previewUrl} alt={title.name} />
                      ) : (
                        <div className="list-thumb placeholder-thumb">
                          {(title.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="list-main-copy">
                      <div className="list-title">{title.name || 'Unknown title belt'}</div>
                      <div className="small-text muted-text">
                        {title.creator_name || 'Unknown creator'} · Updated {formatDate(title.updated_at)}
                      </div>
                    </div>
                  </div>

                  <div className="list-meta wrap-meta">
                    <span>{imageCount} screenshot{imageCount === 1 ? '' : 's'}</span>
                    <span>{audioCount} audio file{audioCount === 1 ? '' : 's'}</span>
                    <span>{openRequests} open request{openRequests === 1 ? '' : 's'}</span>
                  </div>

                  {session && canManageContent(title.owner_id) ? (
                    <div className="list-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="ghost-button inline-btn small-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(title)
                        }}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="ghost-button inline-btn small-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete?.(title)
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