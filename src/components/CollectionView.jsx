import { useEffect, useMemo, useState } from 'react'
import {
  formatDate,
  titleCase,
  parseDownloadLinks,
  getCollectionItemTarget,
  getModTypeLabel,
  getOtherModSubtypeLabel
} from '../lib/utils'

function getCollectionItemData(item) {
  const target = getCollectionItemTarget(item)

  const attire = item.attire || item.attires || null
  const arena = item.arena || item.arenas || null
  const titleBelt = item.title_belt || item.title || item.titleBelt || null
  const otherMod = item.other_mod || item.otherMods || item.other || null

  const isAttire = target.mod_type === 'attire'
  const isArena = target.mod_type === 'arena'
  const isTitle = target.mod_type === 'title'
  const isOther = target.mod_type === 'other'

  const entity = isAttire
    ? attire
    : isArena
      ? arena
      : isTitle
        ? titleBelt
        : isOther
          ? otherMod
          : null

  const displayName = entity?.name || 'Unknown item'

  const subtitle = isAttire
    ? `${attire?.wrestler?.wrestler_name || 'Unknown wrestler'} · ${attire?.source_game || '—'}`
    : isArena
      ? `Arena · ${arena?.source_game || '—'}`
      : isTitle
        ? `Title Belt · ${titleBelt?.source_game || '—'}`
        : isOther
          ? `${getOtherModSubtypeLabel(target.mod_subtype)} · ${otherMod?.source_game || '—'}`
          : getModTypeLabel(target.mod_type)

  const creatorName = entity?.creator_name || ''

  const image = isAttire
    ? attire?.attire_images?.[0]
    : isArena
      ? arena?.arena_images?.[0]
      : isTitle
        ? titleBelt?.title_belt_images?.[0]
        : isOther
          ? otherMod?.other_mod_images?.[0]
          : null

  const thumbUrl = image?.image_url || image?.url || ''
  const downloadUrl = entity?.download_url || ''
  const linkCount = parseDownloadLinks(downloadUrl).length

  return {
    target,
    entity,
    isAttire,
    isArena,
    isTitle,
    isOther,
    displayName,
    subtitle,
    creatorName,
    thumbUrl,
    downloadUrl,
    linkCount
  }
}

export default function CollectionView({
  collection,
  canContribute,
  canManageCollection,
  onClose,
  onSelectWrestler,
  onSelectArena,
  onRemoveItem,
  onBulkRemoveItems
}) {
  const [viewMode, setViewMode] = useState('grid')
  const [selectedIds, setSelectedIds] = useState([])
  const [previewImage, setPreviewImage] = useState(null)

  const items = collection?.items || []

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => items.some((item) => item.id === id))
    )
  }, [items])

  useEffect(() => {
    setSelectedIds([])
  }, [collection?.id])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setPreviewImage(null)
    }
    if (previewImage) {
      window.addEventListener('keydown', handleKey)
    }
    return () => window.removeEventListener('keydown', handleKey)
  }, [previewImage])

  if (!collection) return null

  function toggleSelected(itemId) {
    setSelectedIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    )
  }

  function toggleSelectAll() {
    if (selectedIds.length === items.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(items.map((item) => item.id))
    }
  }

  async function handleBulkRemove() {
    if (!selectedIds.length || !onBulkRemoveItems) return
    await onBulkRemoveItems(selectedIds)
    setSelectedIds([])
  }

  return (
    <section className="panel detail-hero collection-view-panel">
      <div className="panel-header with-actions">
        <div>
          <div className="eyebrow">Collection page</div>
          <h2>{collection.name}</h2>
          <p className="subtle-copy">{collection.description || 'No description added yet.'}</p>
        </div>

        <div className="wrap-actions">
          <button className="ghost-button" onClick={onClose} type="button">
            Back to collections
          </button>
        </div>
      </div>

      <div className="collection-hero-grid">
        {collection.cover_url ? (
          <img className="collection-hero-cover" src={collection.cover_url} alt={collection.name} />
        ) : (
          <div className="collection-hero-cover collection-cover-placeholder">
            {collection.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="collection-hero-copy">
          <div className="mini-stats mini-stats-three">
            <div>
              <span>Visibility</span>
              <strong>{titleCase(collection.visibility)}</strong>
            </div>
            <div>
              <span>Items</span>
              <strong>{items.length}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>{formatDate(collection.updated_at)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-header with-actions">
        <div>
          <h3>Collection items</h3>
          <p className="subtle-copy">
            Browse all saved mods with category tags, quick links, and removal tools.
          </p>
        </div>

        <div className="wrap-actions">
          <div className="view-toggle">
            <button
              type="button"
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              type="button"
              className={viewMode === 'compact' ? 'active' : ''}
              onClick={() => setViewMode('compact')}
            >
              Compact
            </button>
          </div>

          {canManageCollection && items.length ? (
            <>
            {selectedIds.length > 0 ? (
              <span className="pill subtle-pill">
                {selectedIds.length} selected
              </span>
            ) : null}

              <button
                type="button"
                className="ghost-button small-btn"
                onClick={toggleSelectAll}
                disabled={!items.length}
              >
                {selectedIds.length === items.length ? 'Clear selection' : 'Select all'}
              </button>

              <button
                type="button"
                className="ghost-button small-btn"
                disabled={!selectedIds.length}
                onClick={handleBulkRemove}
              >
                Remove selected
              </button>
            </>
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state small-empty">This collection has no items yet.</div>
      ) : viewMode === 'compact' ? (
        <div className="compact-attire-table">
          {items.map((item) => {
            const {
              target,
              entity,
              isAttire,
              isArena,
              subtitle,
              creatorName,
              displayName,
              linkCount
            } = getCollectionItemData(item)

            return (
              <article className="compact-attire-row" key={item.id}>
                <div className="compact-main">
                  <div className="compact-title-row">
                    {canManageCollection ? (
                      <label className="collection-select-check">
                        <input
                          type="checkbox"
                          className="collection-checkbox-input"
                          checked={selectedIdSet.has(item.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleSelected(item.id)
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </label>
                    ) : null}

                    <strong title={displayName}>{displayName}</strong>

                    <span className="pill subtle-pill">
                      {getModTypeLabel(target.mod_type)}
                    </span>

                    {target.mod_type === 'other' && target.mod_subtype ? (
                      <span className="pill subtle-pill">
                        {getOtherModSubtypeLabel(target.mod_subtype)}
                      </span>
                    ) : null}
                  </div>

                  <div className="compact-meta-line">
                    <span className="collection-item-subtitle">{subtitle}</span>
                    {creatorName ? (
                      <span className="creator-badge small-creator-badge">{creatorName}</span>
                    ) : null}
                    {canContribute ? (
                      linkCount ? (
                        <span className="pill">{linkCount} link(s)</span>
                      ) : (
                        <span className="pill danger-pill">No link</span>
                      )
                    ) : null}
                  </div>
                </div>

                <div className="compact-side">
                  <div className="compact-actions-row">
                    {isAttire && entity?.wrestler ? (
                      <button
                        className="secondary-button small-btn"
                        onClick={() =>
                          onSelectWrestler?.({
                            wrestlerId: entity.wrestler.id,
                            wrestlerName: entity.wrestler.wrestler_name
                          })
                        }
                        type="button"
                      >
                        Open wrestler
                      </button>
                    ) : null}

                    {isArena ? (
                      <button
                        className="secondary-button small-btn"
                        onClick={() =>
                          onSelectArena?.({
                            arenaId: entity.id,
                            arenaName: entity.name
                          })
                        }
                        type="button"
                      >
                        Open arena
                      </button>
                    ) : null}

                    {canManageCollection && onRemoveItem ? (
                      <button
                        className="ghost-button small-btn"
                        onClick={() => onRemoveItem(item)}
                        type="button"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="collection-items-grid">
          {items.map((item) => {
            const {
              target,
              entity,
              isAttire,
              isArena,
              subtitle,
              creatorName,
              thumbUrl,
              displayName,
              linkCount
            } = getCollectionItemData(item)

            return (
              <article className="collection-item-card enhanced-collection-item-card" key={item.id}>
                <div className="collection-item-topbar">
                  <div className="wrap-actions">
                    <span className="pill subtle-pill">{getModTypeLabel(target.mod_type)}</span>
                    {target.mod_type === 'other' && target.mod_subtype ? (
                      <span className="pill subtle-pill">
                        {getOtherModSubtypeLabel(target.mod_subtype)}
                      </span>
                    ) : null}
                  </div>

                  {canManageCollection ? (
                    <label className="collection-select-check">
                      <input
                        type="checkbox"
                        className="collection-checkbox-input"
                        checked={selectedIdSet.has(item.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleSelected(item.id)
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </label>
                  ) : null}
                </div>

                {thumbUrl ? (
                  <button
                    type="button"
                    className="collection-thumb-button"
                    onClick={() => setPreviewImage(thumbUrl)}
                  >
                    <img className="collection-item-thumb" src={thumbUrl} alt={displayName} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="collection-thumb-button collection-item-thumb collection-cover-placeholder"
                    onClick={() => {
                      if (isAttire && entity?.wrestler) {
                        onSelectWrestler?.({
                          wrestlerId: entity.wrestler.id,
                          wrestlerName: entity.wrestler.wrestler_name
                        })
                      } else if (isArena) {
                        onSelectArena?.({
                          arenaId: entity.id,
                          arenaName: entity.name
                        })
                      }
                    }}
                  >
                    {displayName.slice(0, 2).toUpperCase()}
                  </button>
                )}

                <div className="collection-item-body">
                  <h3 title={displayName}>{displayName}</h3>

                  <div className="muted-text small-text">{subtitle}</div>

                  {creatorName ? (
                    <div className="creator-badge prominent-creator-badge">{creatorName}</div>
                  ) : null}

                  <div className="collection-item-meta-row">
                    {canContribute ? (
                      linkCount ? (
                        <span className="pill">{linkCount} link(s)</span>
                      ) : (
                        <span className="pill danger-pill">No link</span>
                      )
                    ) : null}
                  </div>

                  <div className="collection-actions wrap-actions">
                    {isAttire && entity?.wrestler ? (
                      <button
                        className="secondary-button small-btn"
                        onClick={() =>
                          onSelectWrestler?.({
                            wrestlerId: entity.wrestler.id,
                            wrestlerName: entity.wrestler.wrestler_name
                          })
                        }
                        type="button"
                      >
                        Open wrestler
                      </button>
                    ) : null}

                    {isArena ? (
                      <button
                        className="secondary-button small-btn"
                        onClick={() =>
                          onSelectArena?.({
                            arenaId: entity.id,
                            arenaName: entity.name
                          })
                        }
                        type="button"
                      >
                        Open arena
                      </button>
                    ) : null}

                    {canManageCollection && onRemoveItem ? (
                      <button
                        className="ghost-button small-btn"
                        onClick={() => onRemoveItem(item)}
                        type="button"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {previewImage ? (
        <div
          className="image-modal-backdrop image-modal-backdrop-open"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="image-modal-content image-modal-content-open"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={previewImage} alt="Collection preview" />
          </div>
        </div>
      ) : null}
    </section>
  )
}