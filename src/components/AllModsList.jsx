import {
  formatDate,
  getModTypeLabel,
  getOtherModSubtypeLabel,
  getSubtypeIcon
} from '../lib/utils'

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

function CategoryPills({ item }) {
  return (
    <div className="wrap-actions">
      <span className="pill subtle-pill">{getModTypeLabel(item.modType)}</span>

      {item.modType === 'other' && item.modSubtype ? (
        <span className={`pill subtype-pill subtype-${item.modSubtype}`}>
          <span className="pill-icon">{getSubtypeIcon(item.modSubtype)}</span>
          {getOtherModSubtypeLabel(item.modSubtype)}
        </span>
      ) : null}
    </div>
  )
}

function OpenButton({
  item,
  onOpenAttire,
  onOpenArena,
  onOpenTitle,
  onOpenOtherMod
}) {
  if (item.modType === 'attire') {
    return (
      <button
        type="button"
        className="secondary-button small-btn"
        onClick={() => onOpenAttire?.(item)}
      >
        Open wrestler
      </button>
    )
  }

  if (item.modType === 'arena') {
    return (
      <button
        type="button"
        className="secondary-button small-btn"
        onClick={() => onOpenArena?.(item)}
      >
        Open arena
      </button>
    )
  }

  if (item.modType === 'title') {
    return (
      <button
        type="button"
        className="secondary-button small-btn"
        onClick={() => onOpenTitle?.(item)}
      >
        Open title
      </button>
    )
  }

  if (item.modType === 'other') {
    return (
      <button
        type="button"
        className="secondary-button small-btn"
        onClick={() => onOpenOtherMod?.(item)}
      >
        Open other mod
      </button>
    )
  }

  return null
}

function openUnifiedItem(item, onOpenAttire, onOpenArena, onOpenTitle, onOpenOtherMod) {
  if (item.modType === 'attire') {
    onOpenAttire?.(item)
    return
  }

  if (item.modType === 'arena') {
    onOpenArena?.(item)
    return
  }

  if (item.modType === 'title') {
    onOpenTitle?.(item)
    return
  }

  if (item.modType === 'other') {
    onOpenOtherMod?.(item)
  }
}

function ResultStats({ items = [] }) {
  const stats = items.reduce(
    (acc, item) => {
      acc.total += 1

      if (item.modType === 'attire') acc.attires += 1
      if (item.modType === 'arena') acc.arenas += 1
      if (item.modType === 'title') acc.titles += 1
      if (item.modType === 'other') acc.otherMods += 1
      if (!item.hasDownload) acc.noLinks += 1

      return acc
    },
    {
      total: 0,
      attires: 0,
      arenas: 0,
      titles: 0,
      otherMods: 0,
      noLinks: 0
    }
  )

  return (
    <div className="mini-stats mini-stats-three allmods-mini-stats">
      <div>
        <span>Total results</span>
        <strong>{stats.total}</strong>
      </div>
      <div>
        <span>Attires / Arenas</span>
        <strong>{stats.attires} / {stats.arenas}</strong>
      </div>
      <div>
        <span>Titles / Other Mods</span>
        <strong>{stats.titles} / {stats.otherMods}</strong>
      </div>
      <div>
        <span>No download link</span>
        <strong>{stats.noLinks}</strong>
      </div>
    </div>
  )
}

function FeaturedStrip({
  title,
  subtitle,
  items,
  onOpenAttire,
  onOpenArena,
  onOpenTitle,
  onOpenOtherMod
}) {
  if (!items.length) return null

  return (
    <section className="panel soft-panel list-panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p className="subtle-copy">{subtitle}</p>
        </div>
      </div>

      <div className="collection-items-grid">
        {items.map((item) => (
          <article className="collection-item-card enhanced-collection-item-card" key={item.key}>
            <div className="collection-item-topbar">
              <CategoryPills item={item} />
            </div>

            <button
              type="button"
              className="collection-thumb-button"
              onClick={() =>
                openUnifiedItem(
                  item,
                  onOpenAttire,
                  onOpenArena,
                  onOpenTitle,
                  onOpenOtherMod
                )
              }
            >
              {item.previewUrl ? (
                <img
                  className="collection-item-thumb"
                  src={item.previewUrl}
                  alt={item.title || 'Mod preview'}
                />
              ) : (
                <div className="collection-item-thumb collection-cover-placeholder">
                  {(item.title || '?').slice(0, 2).toUpperCase()}
                </div>
              )}
            </button>

            <div className="collection-item-body">
              <h3 title={item.title}>{item.title}</h3>

              <div className="muted-text small-text">
                {item.parentTitle
                  ? `${item.parentTitle} · ${item.sourceGame || '—'}`
                  : item.sourceGame || '—'}
              </div>

              {item.creatorName ? (
                <div className="creator-badge prominent-creator-badge">
                  {item.creatorName}
                </div>
              ) : null}

              <div className="collection-item-meta-row">
                <span className="pill subtle-pill">{formatDate(item.createdAt)}</span>
                {item.hasDownload ? (
                  <span className="pill">
                    {item.linkCount} link{item.linkCount === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="pill danger-pill">No link</span>
                )}
              </div>

              <div className="collection-actions wrap-actions">
                <OpenButton
                  item={item}
                  onOpenAttire={onOpenAttire}
                  onOpenArena={onOpenArena}
                  onOpenTitle={onOpenTitle}
                  onOpenOtherMod={onOpenOtherMod}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function AllModsList({
  items = [],
  summaryItems = [],
  featuredItems = [],
  latestItems = [],
  viewMode,
  setViewMode,
  pagination,
  onPageChange,
  onOpenAttire,
  onOpenArena,
  onOpenTitle,
  onOpenOtherMod
}) {
  const pageStart = pagination ? (pagination.page - 1) * pagination.perPage + 1 : 0
  const pageEnd = pagination
    ? Math.min(pagination.page * pagination.perPage, pagination.totalItems)
    : items.length
  const pageNumbers = pagination ? buildPageNumbers(pagination.page, pagination.totalPages) : []

  return (
    <>
      <FeaturedStrip
        title="Latest uploads"
        subtitle="Newest items across attires, arenas, title belts, and other mods."
        items={featuredItems}
        onOpenAttire={onOpenAttire}
        onOpenArena={onOpenArena}
        onOpenTitle={onOpenTitle}
        onOpenOtherMod={onOpenOtherMod}
      />

      <FeaturedStrip
        title="Recently updated"
        subtitle="Recently edited entries across the full mod database."
        items={latestItems}
        onOpenAttire={onOpenAttire}
        onOpenArena={onOpenArena}
        onOpenTitle={onOpenTitle}
        onOpenOtherMod={onOpenOtherMod}
      />

      <section className="panel soft-panel list-panel">
        <div className="panel-header with-actions">
          <div>
            <h2>All mods</h2>
            <p className="subtle-copy">
              {pagination
                ? `${pagination.totalItems} total · showing ${pagination.totalItems ? pageStart : 0}-${pageEnd}`
                : `${items.length} visible`}
            </p>
          </div>

          <Toggle
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'grid', label: 'Grid' },
              { value: 'compact', label: 'Compact' }
            ]}
          />
        </div>

        <ResultStats items={summaryItems} />

        {items.length === 0 ? (
          <div className="empty-state small-empty">
            No mods match the current filters.
          </div>
        ) : viewMode === 'compact' ? (
          <div className="compact-attire-table">
            {items.map((item) => (
              <article className="compact-attire-row" key={item.key}>
                <div className="compact-main">
                  <div className="compact-title-row">
                    <strong title={item.title}>{item.title}</strong>
                    <CategoryPills item={item} />
                  </div>

                  <div className="compact-meta-line">
                    <span className="collection-item-subtitle">
                      {item.parentTitle
                        ? `${item.parentTitle} · ${item.sourceGame || '—'}`
                        : item.sourceGame || '—'}
                    </span>

                    {item.creatorName ? (
                      <span className="creator-badge small-creator-badge">
                        {item.creatorName}
                      </span>
                    ) : null}

                    <span className="pill subtle-pill">{formatDate(item.createdAt)}</span>

                    {item.hasDownload ? (
                      <span className="pill">
                        {item.linkCount} link{item.linkCount === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="pill danger-pill">No link</span>
                    )}
                  </div>
                </div>

                <div className="compact-side">
                  <div className="compact-actions-row">
                    <OpenButton
                      item={item}
                      onOpenAttire={onOpenAttire}
                      onOpenArena={onOpenArena}
                      onOpenTitle={onOpenTitle}
                      onOpenOtherMod={onOpenOtherMod}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="collection-items-grid">
            {items.map((item) => (
              <article className="collection-item-card enhanced-collection-item-card" key={item.key}>
                <div className="collection-item-topbar">
                  <CategoryPills item={item} />
                </div>

                <button
                  type="button"
                  className="collection-thumb-button"
                  onClick={() =>
                    openUnifiedItem(
                      item,
                      onOpenAttire,
                      onOpenArena,
                      onOpenTitle,
                      onOpenOtherMod
                    )
                  }
                >
                  {item.previewUrl ? (
                    <img
                      className="collection-item-thumb"
                      src={item.previewUrl}
                      alt={item.title || 'Mod preview'}
                    />
                  ) : (
                    <div className="collection-item-thumb collection-cover-placeholder">
                      {(item.title || '?').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </button>

                <div className="collection-item-body">
                  <h3 title={item.title}>{item.title}</h3>

                  <div className="muted-text small-text">
                    {item.parentTitle
                      ? `${item.parentTitle} · ${item.sourceGame || '—'}`
                      : item.sourceGame || '—'}
                  </div>

                  {item.creatorName ? (
                    <div className="creator-badge prominent-creator-badge">
                      {item.creatorName}
                    </div>
                  ) : null}

                  <div className="collection-item-meta-row">
                    <span className="pill subtle-pill">{formatDate(item.createdAt)}</span>
                    {item.hasDownload ? (
                      <span className="pill">
                        {item.linkCount} link{item.linkCount === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="pill danger-pill">No link</span>
                    )}
                  </div>

                  <div className="collection-actions wrap-actions">
                    <OpenButton
                      item={item}
                      onOpenAttire={onOpenAttire}
                      onOpenArena={onOpenArena}
                      onOpenTitle={onOpenTitle}
                      onOpenOtherMod={onOpenOtherMod}
                    />
                  </div>
                </div>
              </article>
            ))}
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
    </>
  )
}