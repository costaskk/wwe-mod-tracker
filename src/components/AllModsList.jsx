import { useMemo, useRef, useState, useEffect } from 'react'
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
    <div className="mod-badges-inline">
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

function ImageViewerModal({
  open,
  images = [],
  index = 0,
  title = '',
  onClose,
  onPrev,
  onNext
}) {
  if (!open || !images.length) return null

  return (
    <div className="image-modal-backdrop" onClick={onClose}>
      <div
        className="image-modal-content image-modal-content-open"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="ghost-button small-btn image-nav-btn image-nav-left"
          onClick={onPrev}
        >
          ←
        </button>

        <img src={images[index]} alt={`${title} screenshot ${index + 1}`} />

        <button
          type="button"
          className="ghost-button small-btn image-nav-btn image-nav-right"
          onClick={onNext}
        >
          →
        </button>

        <button
          type="button"
          className="ghost-button small-btn image-close-btn"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}

function ItemThumb({
  item,
  onOpenViewer
}) {
  const galleryImages = (item?.images || [])
    .map((img) => img?.image_url || img?.url || '')
    .filter(Boolean)

  const previewImages = galleryImages.length
    ? galleryImages
    : (item?.previewUrl ? [item.previewUrl] : [])

  const titleText = item?.title || 'Unknown mod'
  const [activeIndex, setActiveIndex] = useState(0)
  const hoverIntervalRef = useRef(null)

  useEffect(() => {
    setActiveIndex(0)
  }, [item?.key])

  useEffect(() => {
    return () => {
      if (hoverIntervalRef.current) {
        clearInterval(hoverIntervalRef.current)
      }
    }
  }, [])

  function startHoverRotation() {
    if (previewImages.length <= 1) return

    clearInterval(hoverIntervalRef.current)

    hoverIntervalRef.current = setInterval(() => {
        setActiveIndex((current) => (current + 1) % previewImages.length)
    }, 1000)
  }

  function stopHoverRotation() {
    if (hoverIntervalRef.current) {
      clearInterval(hoverIntervalRef.current)
      hoverIntervalRef.current = null
    }
  }

  const currentImage = previewImages[activeIndex] || ''

  return (
    <div
      className="allmods-thumb-stack"
      onMouseEnter={startHoverRotation}
      onMouseLeave={stopHoverRotation}
    >
      <button
        type="button"
        className="collection-thumb-button"
        onClick={() => {
          if (previewImages.length) {
            onOpenViewer?.(previewImages, activeIndex, titleText)
          }
        }}
      >
        {currentImage ? (
          <img
            className="collection-item-thumb"
            src={currentImage}
            alt={titleText}
          />
        ) : (
          <div className="collection-item-thumb collection-cover-placeholder">
            {titleText.slice(0, 2).toUpperCase()}
          </div>
        )}
      </button>

      {previewImages.length > 1 ? (
        <div className="allmods-thumb-strip">
          {previewImages.slice(0, 4).map((image, index) => (
            <button
              key={`${item.key}-thumb-${index}`}
              type="button"
              className={`allmods-thumb-mini ${index === activeIndex ? 'active-thumb' : ''}`}
              onClick={() => setActiveIndex(index)}
            >
              <img src={image} alt={`${titleText} screenshot ${index + 1}`} />
            </button>
          ))}

          {previewImages.length > 4 ? (
            <div className="allmods-thumb-more">+{previewImages.length - 4}</div>
          ) : null}
        </div>
      ) : null}
    </div>
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
          className={`ghost-button small-btn ${item.isInstalled ? 'installed-btn-active' : ''}`}
          onClick={() => onToggleInstalled(item)}
        >
          {item.isInstalled ? 'Installed in my game' : 'Mark installed'}
        </button>
      ) : null}

      {onAddToCollection ? (
        <button
          type="button"
          className={`ghost-button small-btn ${item.inCollection ? 'collection-btn-active' : ''}`}
          onClick={() => onAddToCollection(item)}
          title={
            item.inCollection
              ? item.collectionNames?.join(', ')
              : 'Add to collection'
          }
        >
          {item.inCollection
            ? `In ${item.collectionCount} collection${item.collectionCount === 1 ? '' : 's'}`
            : 'Add to collection'}
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
  onAddToCollection,
  onOpenViewer
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

        <div className="carousel-header-actions">
          <Toggle
            value={mode}
            onChange={setMode}
            options={[
              { value: 'latest', label: 'Latest' },
              { value: 'updated', label: 'Updated' },
              { value: 'trending', label: 'Trending' }
            ]}
          />

          <div className="carousel-arrow-group">
            <button
              type="button"
              className="ghost-button small-btn carousel-arrow-btn"
              onClick={() => scrollRail('left')}
              aria-label="Scroll left"
            >
              ←
            </button>

            <button
              type="button"
              className="ghost-button small-btn carousel-arrow-btn"
              onClick={() => scrollRail('right')}
              aria-label="Scroll right"
            >
              →
            </button>
          </div>
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

            <ItemThumb item={item} onOpenViewer={onOpenViewer} />

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

              <div className="collection-actions allmods-card-actions">
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
  const [viewer, setViewer] = useState({
    open: false,
    images: [],
    index: 0,
    title: ''
  })

  function openViewer(images, index = 0, title = '') {
    setViewer({
      open: true,
      images,
      index,
      title
    })
  }

  function closeViewer() {
    setViewer({
      open: false,
      images: [],
      index: 0,
      title: ''
    })
  }

  function showPrevViewerImage() {
    setViewer((current) => {
      const nextIndex =
        current.index <= 0 ? current.images.length - 1 : current.index - 1

      return {
        ...current,
        index: nextIndex
      }
    })
  }

  function showNextViewerImage() {
    setViewer((current) => {
      const nextIndex =
        current.index >= current.images.length - 1 ? 0 : current.index + 1

      return {
        ...current,
        index: nextIndex
      }
    })
  }

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
        onOpenViewer={openViewer}
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
                <div className="compact-main compact-main-allmods">
                  <div className="compact-title-row">
                    <strong title={item.title}>{item.title}</strong>
                    <CategoryPills item={item} />
                  </div>

                  <div className="compact-meta-line compact-meta-line-allmods">
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

                <ItemThumb item={item} onOpenViewer={openViewer} />

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

                  <div className="collection-actions allmods-card-actions">
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
          <div className="pagination-container">
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
          </div>
        ) : null}
      </section>

      <ImageViewerModal
        open={viewer.open}
        images={viewer.images}
        index={viewer.index}
        title={viewer.title}
        onClose={closeViewer}
        onPrev={showPrevViewerImage}
        onNext={showNextViewerImage}
      />
    </>
  )
}