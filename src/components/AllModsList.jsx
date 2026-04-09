import { useMemo, useRef, useState } from 'react'
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

function openUnifiedItem(item, onOpenAttire, onOpenArena, onOpenTitle, onOpenOtherMod) {
  if (!item) return

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

function ResultStats({ items = [] }) {
  const stats = useMemo(
    () =>
      items.reduce(
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
      ),
    [items]
  )

  return (
    <div className="allmods-stats-grid">
      <div className="stat-card panel soft-panel">
        <div className="stat-label">Total results</div>
        <div className="stat-value">{stats.total}</div>
      </div>

      <div className="stat-card panel soft-panel">
        <div className="stat-label">Attires</div>
        <div className="stat-value">{stats.attires}</div>
      </div>

      <div className="stat-card panel soft-panel">
        <div className="stat-label">Arenas</div>
        <div className="stat-value">{stats.arenas}</div>
      </div>

      <div className="stat-card panel soft-panel">
        <div className="stat-label">Titles</div>
        <div className="stat-value">{stats.titles}</div>
      </div>

      <div className="stat-card panel soft-panel">
        <div className="stat-label">Other Mods</div>
        <div className="stat-value">{stats.otherMods}</div>
      </div>

      <div className="stat-card panel soft-panel">
        <div className="stat-label">No download link</div>
        <div className="stat-value">{stats.noLinks}</div>
      </div>
    </div>
  )
}

function ItemThumb({ item, onOpenAttire, onOpenArena, onOpenTitle, onOpenOtherMod }) {
  const titleText = item?.title || 'Unknown mod'
  const thumb = item?.previewUrl || ''

  return (
    <button
      type="button"
      className="collection-thumb-button"
      onClick={() =>
        openUnifiedItem(item, onOpenAttire, onOpenArena, onOpenTitle, onOpenOtherMod)
      }
    >
      {thumb ? (
        <img
          className="collection-item-thumb"
          src={thumb}
          alt={titleText}
        />
      ) : (
        <div className="collection-item-thumb collection-cover-placeholder">
          {titleText.slice(0, 2).toUpperCase()}
        </div>
      )}
    </button>
  )
}

function ActionButtons({
  item,
  onOpenAttire,
  onOpenArena,
  onOpenTitle,
  onOpenOtherMod,
  onToggleInstalled,
  onAddToCollection
}) {
  return (
    <div className="wrap-actions">
      {item.modType === 'attire' ? (
        <button
          type="button"
          className="secondary-button small-btn"
          onClick={() => onOpenAttire?.(item)}
        >
          Open wrestler
        </button>
      ) : null}

      {item.modType === 'arena' ? (
        <button
          type="button"
          className="secondary-button small-btn"
          onClick={() => onOpenArena?.(item)}
        >
          Open arena
        </button>
      ) : null}

      {item.modType === 'title' ? (
        <button
          type="button"
          className="secondary-button small-btn"
          onClick={() => onOpenTitle?.(item)}
        >
          Open title
        </button>
      ) : null}

      {item.modType === 'other' ? (
        <button
          type="button"
          className="secondary-button small-btn"
          onClick={() => onOpenOtherMod?.(item)}
        >
          Open other mod
        </button>
      ) : null}

      {onToggleInstalled ? (
        <button
          type="button"
          className="ghost-button small-btn"
          onClick={() => onToggleInstalled(item)}
        >
          Mark installed
        </button>
      ) : null}

      {onAddToCollection ? (
        <button
          type="button"
          className="ghost-button small-btn"
          onClick={() => onAddToCollection(item)}
        >
          Add to collection
        </button>
      ) : null}
    </div>
  )
}

function CompactActionButtons({
  item,
  onOpenAttire,
  onOpenArena,
  onOpenTitle,
  onOpenOtherMod,
  onToggleInstalled,
  onAddToCollection
}) {
  return (
    <div className="compact-actions-row wrap-actions">
      <ActionButtons
        item={item}
        onOpenAttire={onOpenAttire}
        onOpenArena={onOpenArena}
        onOpenTitle={onOpenTitle}
        onOpenOtherMod={onOpenOtherMod}
        onToggleInstalled={onToggleInstalled}
        onAddToCollection={onAddToCollection}
      />
    </div>
  )
}

function CarouselSection({
  mode,
  setMode,
  featuredItems = [],
  latestItems = [],
  trendingItems = [],
  onOpenAttire,
  onOpenArena,
  onOpenTitle,
  onOpenOtherMod,
  onToggleInstalled,
  onAddToCollection
}) {
  const railRef = useRef(null)

  const items =
    mode === 'latest'
      ? featuredItems
      : mode === 'updated'
        ? latestItems
        : trendingItems

  function scrollRail(direction) {
    if (!railRef.current) return
    const amount = Math.max(320, Math.floor(railRef.current.clientWidth * 0.82))
    railRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    })
  }

  const title =
    mode === 'latest'
      ? 'Latest uploads'
      : mode === 'updated'
        ? 'Recently updated'
        : 'Trending'

  const subtitle =
    mode === 'latest'
      ? 'Newest items across attires, arenas, title belts, and other mods.'
      : mode === 'updated'
        ? 'Recently edited entries across the full mod database.'
        : 'Popular picks based on your feed ranking.'

  if (!items.length) return null

  return (
    <section className="panel soft-panel list-panel">
      <div className="panel-header with-actions">
        <div>
          <h2>{title}</h2>
          <p className="subtle-copy">{subtitle}</p>
        </div>

        <div className="wrap-actions">
          <Toggle
            value={mode}
            onChange={setMode}
            options={[
              { value: 'latest', label: 'Latest' },
              { value: 'updated', label: 'Updated' },
              { value: 'trending', label: 'Trending' }
            ]}
          />

          <button
            type="button"
            className="ghost-button small-btn"
            onClick={() => scrollRail('left')}
          >
            ←
          </button>

          <button
            type="button"
            className="ghost-button small-btn"
            onClick={() => scrollRail('right')}
          >
            →
          </button>
        </div>
      </div>

      <div className="allmods-carousel-rail" ref={railRef}>
        {items.map((item) => (
          <article
            className="allmods-carousel-card collection-item-card enhanced-collection-item-card"
            key={item.key}
          >
            <div className="collection-item-topbar">
              <CategoryPills item={item} />
            </div>

            <ItemThumb
              item={item}
              onOpenAttire={onOpenAttire}
              onOpenArena={onOpenArena}
              onOpenTitle={onOpenTitle}
              onOpenOtherMod={onOpenOtherMod}
            />

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
                <span className="pill subtle-pill">
                  {formatDate(item.updatedAt || item.createdAt)}
                </span>

                {item.hasDownload ? (
                  <span className="pill">
                    {item.linkCount} link{item.linkCount === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="pill danger-pill">No link</span>
                )}
              </div>

              <div className="collection-actions wrap-actions">
                <ActionButtons
                    item={item}
                    onOpenAttire={onOpenAttire}
                    onOpenArena={onOpenArena}
                    onOpenTitle={onOpenTitle}
                    onOpenOtherMod={onOpenOtherMod}
                    onToggleInstalled={onToggleInstalled}
                    onAddToCollection={onAddToCollection}
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
  trendingItems = [],
  viewMode,
  setViewMode,
  pagination,
  onPageChange,
  onOpenAttire,
  onOpenArena,
  onOpenTitle,
  onOpenOtherMod,
  onToggleInstalled,
  onAddToCollection
}) {
  const [featuredMode, setFeaturedMode] = useState('latest')

  const pageStart = pagination ? (pagination.page - 1) * pagination.perPage + 1 : 0
  const pageEnd = pagination
    ? Math.min(pagination.page * pagination.perPage, pagination.totalItems)
    : items.length
  const pageNumbers = pagination ? buildPageNumbers(pagination.page, pagination.totalPages) : []

  return (
    <>
      <CarouselSection
        mode={featuredMode}
        setMode={setFeaturedMode}
        featuredItems={featuredItems}
        latestItems={latestItems}
        trendingItems={trendingItems}
        onOpenAttire={onOpenAttire}
        onOpenArena={onOpenArena}
        onOpenTitle={onOpenTitle}
        onOpenOtherMod={onOpenOtherMod}
        onToggleInstalled={onToggleInstalled}
        onAddToCollection={onAddToCollection}
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

        <ResultStats items={summaryItems.length ? summaryItems : items} />

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

                    <span className="pill subtle-pill">
                      {formatDate(item.updatedAt || item.createdAt)}
                    </span>

                    {item.hasDownload ? (
                      <span className="pill">
                        {item.linkCount} link{item.linkCount === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="pill danger-pill">No link</span>
                    )}
                  </div>

                  <CompactActionButtons
                    item={item}
                    onOpenAttire={onOpenAttire}
                    onOpenArena={onOpenArena}
                    onOpenTitle={onOpenTitle}
                    onOpenOtherMod={onOpenOtherMod}
                    onToggleInstalled={onToggleInstalled}
                    onAddToCollection={onAddToCollection}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="collection-items-grid">
            {items.map((item) => (
              <article
                className="collection-item-card enhanced-collection-item-card"
                key={item.key}
              >
                <div className="collection-item-topbar">
                  <CategoryPills item={item} />
                </div>

                <ItemThumb
                  item={item}
                  onOpenAttire={onOpenAttire}
                  onOpenArena={onOpenArena}
                  onOpenTitle={onOpenTitle}
                  onOpenOtherMod={onOpenOtherMod}
                />

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
                    <span className="pill subtle-pill">
                      {formatDate(item.updatedAt || item.createdAt)}
                    </span>

                    {item.hasDownload ? (
                      <span className="pill">
                        {item.linkCount} link{item.linkCount === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="pill danger-pill">No link</span>
                    )}
                  </div>

                  <div className="collection-actions wrap-actions">
                    <ActionButtons
                      item={item}
                      onOpenAttire={onOpenAttire}
                      onOpenArena={onOpenArena}
                      onOpenTitle={onOpenTitle}
                      onOpenOtherMod={onOpenOtherMod}
                      onToggleInstalled={onToggleInstalled}
                      onAddToCollection={onAddToCollection}
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