import { useMemo, useState } from 'react'
import { formatDate, getModTypeLabel, getOtherModSubtypeLabel } from '../lib/utils'

function Toggle({ value, onChange, options }) {
  return (
    <div className="view-toggle">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function statusTone(status = '') {
  if (status === 'fulfilled') return 'pill'
  if (status === 'closed') return 'pill subtle-pill'
  return 'pill warning-pill'
}

function buildGallery(images = []) {
  return (images || [])
    .map((img) =>
      img.full_image_url ||
      img.image_url ||
      img.medium_url ||
      img.thumb_url ||
      img.url ||
      ''
    )
    .filter(Boolean)
}

function enrichPortRequest(request, { wrestlers = [], arenas = [], titleBelts = [], otherMods = [] }) {
  if (request.mod_type === 'attire') {
    for (const wrestler of wrestlers) {
      const attire = (wrestler.attires || []).find((item) => item.id === request.attire_id)
      if (!attire) continue

      const gallery = buildGallery(attire.attire_images || attire.images || [])
      const headshotFallback = [
        wrestler.headshot_full_url,
        wrestler.headshot_url,
        wrestler.headshot_medium_url,
        wrestler.headshot_thumb_url
      ].filter(Boolean)

      const finalGallery = gallery.length ? gallery : headshotFallback

      return {
        ...request,
        displayTitle: attire.name || 'Requested attire',
        displaySubtitle: wrestler.wrestler_name ? `${wrestler.wrestler_name} · Attire` : 'Attire',
        current_game: attire.source_game || 'WWE 2K25',
        gallery: finalGallery,
        previewUrl: finalGallery[0] || '',
        subtype: request.subtype || ''
      }
    }
  }

  if (request.mod_type === 'arena') {
    const arena = arenas.find((item) => item.id === request.arena_id)
    if (arena) {
      const gallery = buildGallery(arena.arena_images || arena.images || [])
      return {
        ...request,
        displayTitle: arena.name || 'Requested arena',
        displaySubtitle: 'Arena',
        current_game: arena.source_game || 'WWE 2K25',
        gallery,
        previewUrl: gallery[0] || '',
        subtype: request.subtype || ''
      }
    }
  }

  if (request.mod_type === 'title') {
    const title = titleBelts.find((item) => item.id === request.title_belt_id)
    if (title) {
      const gallery = buildGallery(title.title_belt_images || title.images || [])
      return {
        ...request,
        displayTitle: title.name || 'Requested title belt',
        displaySubtitle: 'Title belt',
        current_game: title.source_game || 'WWE 2K25',
        gallery,
        previewUrl: gallery[0] || '',
        subtype: request.subtype || ''
      }
    }
  }

  if (request.mod_type === 'other') {
    const otherMod = otherMods.find((item) => item.id === request.other_mod_id)
    if (otherMod) {
      const gallery = buildGallery(otherMod.other_mod_images || otherMod.images || [])
      return {
        ...request,
        displayTitle: otherMod.name || 'Requested other mod',
        displaySubtitle: otherMod.subtype
          ? `Other mod · ${getOtherModSubtypeLabel(otherMod.subtype)}`
          : 'Other mod',
        current_game: otherMod.source_game || 'WWE 2K25',
        gallery,
        previewUrl: gallery[0] || '',
        subtype: otherMod.subtype || request.subtype || ''
      }
    }
  }

  return {
    ...request,
    displayTitle: request.item_name || request.parent_name || 'Requested mod',
    displaySubtitle: getModTypeLabel(request.mod_type || ''),
    current_game: request.source_game || 'WWE 2K25',
    gallery: [],
    previewUrl: '',
    subtype: request.subtype || ''
  }
}

function AddRequestCard({ request, canContribute, isMine, onMarkFulfilled, onMarkClosed }) {
  return (
    <article className="collection-item-card enhanced-collection-item-card">
      <div className="collection-item-topbar">
        <div className="wrap-actions">
          <span className="pill subtle-pill">New mod request</span>
          <span className="pill">{getModTypeLabel(request.mod_type)}</span>
          {request.mod_type === 'other' && request.subtype ? (
            <span className="pill subtype-pill">{getOtherModSubtypeLabel(request.subtype)}</span>
          ) : null}
          <span className={statusTone(request.status)}>{request.status}</span>
        </div>
      </div>

      <div className="request-card-body">
        <h3>{request.item_name || 'Untitled request'}</h3>

        <div className="muted-text small-text">
          {request.mod_type === 'attire'
            ? `Wrestler · ${request.wrestler_name || 'Unknown wrestler'}`
            : request.source_game || 'Unknown game'}
        </div>

        {request.creator_name ? (
          <div className="creator-badge prominent-creator-badge">{request.creator_name}</div>
        ) : null}

        {request.notes ? (
          <p className="collection-description">{request.notes}</p>
        ) : (
          <p className="collection-description">No extra notes.</p>
        )}

        <div className="collection-item-meta-row">
          <span className="muted-text small-text">Created {formatDate(request.created_at)}</span>
          {request.fulfilled_at ? (
            <span className="muted-text small-text">Fulfilled {formatDate(request.fulfilled_at)}</span>
          ) : null}
        </div>

        <div className="collection-actions wrap-actions">
          {canContribute && request.status === 'open' ? (
            <button className="secondary-button small-btn" type="button" onClick={() => onMarkFulfilled?.(request)}>
              Mark fulfilled
            </button>
          ) : null}

          {(isMine || canContribute) && request.status === 'open' ? (
            <button className="ghost-button small-btn" type="button" onClick={() => onMarkClosed?.(request)}>
              Close
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function PortRequestCard({
  request,
  canContribute,
  isMine,
  onFulfill,
  onMarkClosed,
  onOpenImageViewer
}) {
  return (
    <article className="collection-item-card enhanced-collection-item-card">
      <div className="collection-item-topbar">
        <div className="wrap-actions">
          <span className="pill subtle-pill">Port / backport request</span>
          <span className="pill">{getModTypeLabel(request.mod_type)}</span>
          {request.mod_type === 'other' && request.subtype ? (
            <span className="pill subtype-pill">{getOtherModSubtypeLabel(request.subtype)}</span>
          ) : null}
          <span className={statusTone(request.status)}>{request.status}</span>
        </div>
      </div>

      {request.previewUrl ? (
        <button
          type="button"
          className="request-card-preview"
          onClick={() => onOpenImageViewer?.(request.gallery, 0)}
        >
          <img
            className="request-card-preview-img"
            src={request.previewUrl}
            alt={request.displayTitle || 'Requested mod'}
          />
        </button>
      ) : (
        <div className="request-card-preview">
          <div className="request-card-preview-placeholder">
            {request.displayTitle || 'Requested mod'}
          </div>
        </div>
      )}

      <div className="request-card-body">
        <h3>{request.displayTitle || 'Requested mod'}</h3>

        <div className="muted-text small-text">
          {request.displaySubtitle ? `${request.displaySubtitle} · ` : ''}
          {request.current_game || 'WWE 2K25'} → {request.requested_game || 'Unknown game'}
        </div>

        {request.notes ? (
          <p className="collection-description">{request.notes}</p>
        ) : (
          <p className="collection-description">No extra notes.</p>
        )}

        <div className="collection-item-meta-row">
          <span className="muted-text small-text">Created {formatDate(request.created_at)}</span>
          {request.fulfilled_at ? (
            <span className="muted-text small-text">Fulfilled {formatDate(request.fulfilled_at)}</span>
          ) : null}
        </div>

        <div className="collection-actions wrap-actions">
          {canContribute && request.status === 'open' ? (
            <button className="secondary-button small-btn" type="button" onClick={() => onFulfill?.(request)}>
              Fulfill with link
            </button>
          ) : null}

          {(isMine || canContribute) && request.status === 'open' ? (
            <button className="ghost-button small-btn" type="button" onClick={() => onMarkClosed?.(request)}>
              Close
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default function RequestsPage({
  session,
  canContribute,
  modAddRequests = [],
  modPortRequests = [],
  wrestlers = [],
  arenas = [],
  titleBelts = [],
  otherMods = [],
  onOpenImageViewer,
  onOpenAddRequestModal,
  onFulfillPortRequest,
  onMarkAddRequestFulfilled,
  onUpdateAddRequestStatus,
  onUpdatePortRequestStatus
}) {
  const [query, setQuery] = useState('')
  const [requestKind, setRequestKind] = useState('all')
  const [statusFilter, setStatusFilter] = useState('open')
  const [mineOnly, setMineOnly] = useState(false)

  const addRequests = useMemo(
    () => (modAddRequests || []).map((item) => ({ ...item, kind: 'add' })),
    [modAddRequests]
  )

  const portRequests = useMemo(
    () =>
      (modPortRequests || []).map((item) => ({
        ...enrichPortRequest(item, { wrestlers, arenas, titleBelts, otherMods }),
        kind: 'port'
      })),
    [modPortRequests, wrestlers, arenas, titleBelts, otherMods]
  )

  const requestItems = useMemo(() => {
    let items = [...addRequests, ...portRequests]
    const cleanQuery = query.trim().toLowerCase()

    if (requestKind !== 'all') {
      items = items.filter((item) => item.kind === requestKind)
    }

    if (statusFilter !== 'all') {
      items = items.filter((item) => item.status === statusFilter)
    }

    if (mineOnly && session?.user?.id) {
      items = items.filter((item) => item.user_id === session.user.id)
    }

    if (cleanQuery) {
      items = items.filter((item) =>
        [
          item.item_name,
          item.displayTitle,
          item.displaySubtitle,
          item.wrestler_name,
          item.creator_name,
          item.notes,
          item.source_game,
          item.current_game,
          item.requested_game,
          item.mod_type,
          item.subtype
        ]
          .join(' ')
          .toLowerCase()
          .includes(cleanQuery)
      )
    }

    return items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  }, [addRequests, portRequests, query, requestKind, statusFilter, mineOnly, session])

  const openCount = requestItems.filter((item) => item.status === 'open').length
  const fulfilledCount = requestItems.filter((item) => item.status === 'fulfilled').length

  return (
    <section className="panel detail-hero collection-view-panel">
      <div className="panel-header with-actions">
        <div>
          <div className="eyebrow">Community</div>
          <h2>Requests</h2>
          <p className="subtle-copy">
            Submit new mod requests, browse port / backport requests, and fulfill open requests with version links.
          </p>
        </div>

        <div className="wrap-actions">
          <span className="pill subtle-pill">{requestItems.length} visible</span>
          <span className="pill warning-pill">{openCount} open</span>
          <span className="pill">{fulfilledCount} fulfilled</span>

          {canContribute ? (
            <button className="primary-button small-btn" type="button" onClick={onOpenAddRequestModal}>
              Request new mod
            </button>
          ) : null}
        </div>
      </div>

      <div className="panel soft-panel elevated-card">
        <div className="form-grid">
          <label>
            Search requests
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by mod name, wrestler, game, subtype, or notes"
            />
          </label>

          <div className="wrap-actions">
            <Toggle
              value={requestKind}
              onChange={setRequestKind}
              options={[
                { value: 'all', label: 'All' },
                { value: 'add', label: 'New mods' },
                { value: 'port', label: 'Ports' }
              ]}
            />

            <Toggle
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'fulfilled', label: 'Fulfilled' },
                { value: 'closed', label: 'Closed' },
                { value: 'all', label: 'All statuses' }
              ]}
            />

            {session ? (
              <label className="checkbox-row card-checkbox-row">
                <input
                  type="checkbox"
                  checked={mineOnly}
                  onChange={(event) => setMineOnly(event.target.checked)}
                />
                My requests only
              </label>
            ) : null}
          </div>
        </div>
      </div>

      {!requestItems.length ? (
        <div className="empty-state small-empty">
          <div>No requests match the current filters.</div>
        </div>
      ) : (
        <div className="collection-items-grid link-issues-grid">
          {requestItems.map((request) => {
            const isMine = Boolean(session?.user?.id && request.user_id === session.user.id)

            if (request.kind === 'add') {
              return (
                <AddRequestCard
                  key={request.id}
                  request={request}
                  canContribute={canContribute}
                  isMine={isMine}
                  onMarkFulfilled={onMarkAddRequestFulfilled}
                  onMarkClosed={(item) => onUpdateAddRequestStatus?.(item, 'closed')}
                />
              )
            }

            return (
              <PortRequestCard
                key={request.id}
                request={request}
                canContribute={canContribute}
                isMine={isMine}
                onFulfill={onFulfillPortRequest}
                onMarkClosed={(item) => onUpdatePortRequestStatus?.(item, 'closed')}
                onOpenImageViewer={onOpenImageViewer}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}