import { useMemo, useState } from 'react'
import {
  formatDate,
  parseDownloadLinks,
  getDownloadProvider,
  getDownloadProviderLabel,
  getDownloadProviderMark,
  requestSummary
} from '../lib/utils'

function DownloadLinks({ value, canViewLinks }) {
  const links = useMemo(() => parseDownloadLinks(value || ''), [value])

  if (!canViewLinks) {
    return (
      <div className="note-box compact-note">
        Download links are visible only to approved users, moderators, and admins.
      </div>
    )
  }

  if (!links.length) {
    return <div className="note-box compact-note">No download links added yet.</div>
  }

  return (
    <div className="download-links-list">
      {links.map((link, index) => {
        const provider = getDownloadProvider(link)
        return (
          <a
            key={`${link}-${index}`}
            className={`download-link-chip provider-${provider}`}
            href={link}
            target="_blank"
            rel="noreferrer"
          >
            <span className="provider-mark">{getDownloadProviderMark(provider)}</span>
            <span className="provider-label">{getDownloadProviderLabel(provider)}</span>
          </a>
        )
      })}
    </div>
  )
}

function ArenaGallery({ images = [], onPreviewImage }) {
  if (!images.length) {
    return <div className="upload-placeholder">No arena screenshots uploaded</div>
  }

  return (
    <div className="gallery-grid detail-gallery-grid">
      {images.map((image) => (
        <button
          type="button"
          className="gallery-tile gallery-button-reset"
          key={image.id || image.path || image.url}
          onClick={() => onPreviewImage(image.url || image.image_url)}
        >
          <img
            className="gallery-img"
            src={image.url || image.image_url}
            alt={image.name || image.image_name || 'Arena screenshot'}
          />
        </button>
      ))}
    </div>
  )
}

export default function ArenaDetailPanel({
  arena,
  session,
  currentProfile,
  canContribute,
  canManageContent,
  installedArenaIds,
  onAddArena,
  onEditArena,
  onDeleteArena,
  onToggleInstalled,
  onCreateRequest,
  onOpenCollectionPicker
}) {
  const [previewImage, setPreviewImage] = useState(null)  

  const isApprovedViewer = Boolean(
    session && (
      currentProfile?.approval_status === 'approved' ||
      currentProfile?.role === 'moderator' ||
      currentProfile?.role === 'admin'
    )
  )

  if (!arena) {
    return (
        <section className="detail-stack">
        <div className="panel soft-panel empty-state">
            <div>
            <div>Select an arena to view its details.</div>
            {canContribute && onAddArena ? (
                <div style={{ marginTop: '12px' }}>
                <button
                    type="button"
                    className="primary-button small-btn"
                    onClick={onAddArena}
                >
                    Add arena
                </button>
                </div>
            ) : null}
            </div>
        </div>
        </section>
    )
    }

  const images = (arena.images || arena.arena_images || []).map((img) => ({
    ...img,
    url: img.url || img.image_url || ''
  }))

  const requests = arena.requests || []
  const openRequests = requests.filter((item) => item.status === 'open')
  const requestInfo = requestSummary(openRequests, 'arena_id', arena.id)
  const hasMissingDownload = !String(arena.download_url || '').trim()
  const hasDeadLink = openRequests.some((item) => item.request_type === 'dead_link')

  return (
    <section className="detail-stack">
      <div className="panel detail-hero hero-card hero-card-improved">
        <div className="hero-copy compact-copy">
          <div className="eyebrow">Arena mod</div>
          <h1>{arena.name || 'Unknown arena'}</h1>

          <div className="creator-highlight-row">
            <span className="creator-label">Creator</span>
            <span className="creator-badge prominent-creator-badge">
              {arena.creator_name || 'Unknown creator'}
            </span>
          </div>

          {arena.notes ? (
            <div className="note-box">
              {arena.notes}
            </div>
          ) : null}

          <div className="mini-stats mini-stats-three">
            <div>
              <span>Screenshots</span>
              <strong>{images.length}</strong>
            </div>
            <div>
              <span>Open requests</span>
              <strong>{requestInfo.total}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>{formatDate(arena.updated_at)}</strong>
            </div>
          </div>
        </div>

        <div className="hero-side-stack">
          <div className="hero-collection-pill">
            <span className="game-badge">
                {arena.source_game || 'WWE 2K25'}
                {arena.source_game === 'WWE 2K26' ? (
                <span className="latest-badge">NEW</span>
                ) : null}
            </span>
          </div>

          {canContribute ? (
            <div className="hero-actions">

                <button
                type="button"
                className={`ghost-button small-btn ${arena.isInstalled ? 'installed-btn-active' : ''}`}
                onClick={() => onToggleInstalled?.(arena)}
                >
                {arena.isInstalled ? 'Installed in my game' : 'Mark installed'}
                </button>

                {onOpenCollectionPicker ? (
                <button
                    type="button"
                    className={`ghost-button small-btn ${arena.inCollection ? 'collection-btn-active' : ''}`}
                    onClick={() =>
                    onOpenCollectionPicker({
                        ...arena,
                        modType: 'arena',
                        id: arena.id
                    })
                    }
                    title={
                    arena.inCollection
                        ? arena.collectionNames?.join(', ')
                        : 'Add to collection'
                    }
                >
                    {arena.inCollection
                    ? `In ${arena.collectionCount} collection${arena.collectionCount === 1 ? '' : 's'}`
                    : 'Add to collection'}
                </button>
                ) : null}

            </div>
          ) : null}

          {canManageContent(arena.owner_id) ? (
            <div className="hero-actions">
                <button
                type="button"
                className="secondary-button"
                onClick={() => onEditArena(arena)}
                >
                Edit arena
                </button>

                {onDeleteArena ? (
                <button
                    type="button"
                    className="ghost-button"
                    onClick={() => onDeleteArena(arena)}
                >
                    Delete
                </button>
                ) : null}
            </div>
            ) : null}
        </div>
      </div>

      <div className="panel soft-panel improved-attire-card">
        <div className="panel-header">
          <div>
            <h2>Download links</h2>
            <p className="subtle-copy">
              Arena downloads are shown only to approved users, moderators, and admins.
            </p>
          </div>
        </div>

        <DownloadLinks value={arena.download_url} canViewLinks={isApprovedViewer} />

        <div className="wrap-actions">
            {canContribute ? (
                <>
                <button
                    type="button"
                    className="ghost-button small-btn"
                    onClick={() =>
                    onCreateRequest(
                        arena.id,
                        'dead_link',
                        arena.name,
                        'Please check this arena download link.'
                    )
                    }
                >
                    Report dead link
                </button>

                <button
                    type="button"
                    className="ghost-button small-btn"
                    onClick={() =>
                    onCreateRequest(
                        arena.id,
                        'general_request',
                        arena.name,
                        ''
                    )
                    }
                >
                    Request update
                </button>

                {canManageContent(arena.owner_id) && hasMissingDownload ? (
                    <div className="pill danger-pill">Missing download link</div>
                ) : null}

                {canManageContent(arena.owner_id) && hasDeadLink ? (
                    <div className="pill warning-pill">Dead link needs review</div>
                ) : null}
                </>
            ) : null}
        </div>
      </div>

      <div className="panel soft-panel improved-attire-card">
        <div className="panel-header">
          <div>
            <h2>Screenshots</h2>
            <p className="subtle-copy">Preview images for this arena mod.</p>
          </div>
        </div>

        <ArenaGallery images={images} onPreviewImage={setPreviewImage} />
      </div>

      <div className="panel soft-panel improved-attire-card">
        <div className="panel-header">
          <div>
            <h2>Profile JSON</h2>
            <p className="subtle-copy">Install profile or configuration for this arena.</p>
          </div>
        </div>

        {arena.profile_json ? (
          <pre className="json-box">
            {JSON.stringify(arena.profile_json, null, 2)}
          </pre>
        ) : (
          <div className="upload-placeholder">No profile JSON added yet</div>
        )}
      </div>

      <div className="panel soft-panel improved-attire-card">
        <div className="panel-header">
          <div>
            <h2>Request summary</h2>
            <p className="subtle-copy">Open reports and requests for this arena.</p>
          </div>
        </div>

        <div className="mini-stats mini-stats-three">
          <div>
            <span>Total open</span>
            <strong>{requestInfo.total}</strong>
          </div>
          <div>
            <span>Missing links</span>
            <strong>{requestInfo.missingLinks}</strong>
          </div>
          <div>
            <span>Dead links</span>
            <strong>{requestInfo.deadLinks}</strong>
          </div>
        </div>
      </div>
      {previewImage ? (
        <div className="image-modal-backdrop image-modal-backdrop-open" onClick={() => setPreviewImage(null)}>
            <div className="image-modal-content image-modal-content-open" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Arena preview" />
            </div>
        </div>
      ) : null}
    </section>
  )
}