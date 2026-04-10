import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  formatDate,
  parseDownloadLinks,
  getDownloadProvider,
  getDownloadProviderLabel,
  getDownloadProviderMark,
  requestSummary,
  getOtherModSubtypeLabel
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

function OtherModGallery({ images = [], onOpenImageViewer }) {
  if (!images.length) {
    return <div className="upload-placeholder">No screenshots uploaded</div>
  }

  const galleryImages = images
    .map((image) => image.url || image.image_url || '')
    .filter(Boolean)

  return (
    <div className="gallery-grid detail-gallery-grid">
      {images.map((image, index) => {
        const src = image.url || image.image_url || ''

        return (
          <button
            type="button"
            className="gallery-tile gallery-button-reset"
            key={image.id || image.path || image.url || `other-mod-image-${index}`}
            onClick={() => onOpenImageViewer?.(galleryImages, index)}
          >
            <img
              className="gallery-img"
              src={src}
              alt={image.name || image.image_name || 'Other mod screenshot'}
            />
          </button>
        )
      })}
    </div>
  )
}

function JsonProfileSection({ value }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="json-browser-card elevated-card">
      <div className="json-browser-head">
        <strong>JSON profile / install config</strong>
        <button
          className="ghost-button small-btn"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {open ? 'Hide code' : 'Browse code'}
        </button>
      </div>

      {open ? (
        <pre className="json-box">
          {value ? JSON.stringify(value, null, 2) : 'No JSON profile uploaded.'}
        </pre>
      ) : null}
    </div>
  )
}

export default function OtherModDetailPanel({
  mod,
  session,
  currentProfile,
  canContribute,
  canManageContent,
  installedOtherModIds,
  onAddMod,
  onEditMod,
  onDeleteMod,
  onToggleInstalled,
  onCreateRequest,
  onResolveLink,
  onOpenCollectionPicker,
  onOpenImageViewer
}) {

  const isApprovedViewer = Boolean(
    session && (
      currentProfile?.approval_status === 'approved' ||
      currentProfile?.role === 'moderator' ||
      currentProfile?.role === 'admin'
    )
  )

  if (!mod) {
    return (
      <section className="detail-stack">
        <div className="panel soft-panel empty-state">
          <div>
            <div>Select an other mod entry to view its details.</div>
            {canContribute && onAddMod ? (
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="primary-button small-btn"
                  onClick={onAddMod}
                >
                  Add other mod
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    )
  }

  const images = (mod.images || mod.other_mod_images || []).map((img) => ({
    ...img,
    url: img.url || img.image_url || ''
  }))

  const requests = mod.requests || []
  const openRequests = requests.filter((item) => item.status === 'open')
  const requestInfo = requestSummary(openRequests, 'other_mod_id', mod.id)
  const hasMissingDownload = !String(mod.download_url || '').trim()
  const hasDeadLink = openRequests.some((item) => item.request_type === 'dead_link')

  return (
    <section className="detail-stack">
      <div className="panel detail-hero hero-card hero-card-improved">
        <div className="hero-copy compact-copy">
          <div className="eyebrow">Other mod</div>
          <h1>{mod.name || 'Unknown other mod'}</h1>

          <div className="creator-highlight-row wrap-actions">
            <span className="creator-label">Subtype</span>
            <span className="creator-badge prominent-creator-badge">
              {getOtherModSubtypeLabel(mod.subtype || '')}
            </span>

            {mod.creator_name ? (
              <>
                <span className="creator-label">Creator</span>
                <span className="creator-badge prominent-creator-badge">
                  {mod.creator_name}
                </span>
              </>
            ) : null}
          </div>

          {mod.notes ? (
            <div className="note-box">
              {mod.notes}
            </div>
          ) : null}

          <div className="mini-stats mini-stats-three">
            <div>
              <span>Screenshots</span>
              <strong>{images.length}</strong>
            </div>
            <div>
              <span>Subtype</span>
              <strong>{getOtherModSubtypeLabel(mod.subtype || '')}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>{formatDate(mod.updated_at)}</strong>
            </div>
          </div>
        </div>

        <div className="hero-side-stack">
          <div className="hero-collection-pill wrap-actions">
            <span className="game-badge">
              {mod.source_game || 'WWE 2K25'}
              {mod.source_game === 'WWE 2K26' ? (
                <span className="latest-badge">NEW</span>
              ) : null}
            </span>
          </div>

          {canContribute ? (
            <div className="hero-actions">
                {onToggleInstalled ? (
                <button
                    type="button"
                    className={`ghost-button small-btn ${mod.isInstalled ? 'installed-btn-active' : ''}`}
                    onClick={() => onToggleInstalled(mod)}
                >
                    {mod.isInstalled ? 'Installed in my game' : 'Mark installed'}
                </button>
                ) : null}

                {onOpenCollectionPicker ? (
                <button
                    type="button"
                    className={`ghost-button small-btn ${mod.inCollection ? 'collection-btn-active' : ''}`}
                    onClick={() =>
                    onOpenCollectionPicker({
                        ...mod,
                        id: mod.id,
                        modType: 'other'
                    })
                    }
                    title={
                    mod.inCollection
                        ? mod.collectionNames?.join(', ')
                        : 'Add to collection'
                    }
                >
                    {mod.inCollection
                    ? `In ${mod.collectionCount} collection${mod.collectionCount === 1 ? '' : 's'}`
                    : 'Add to collection'}
                </button>
                ) : null}
            </div>
          ) : null}

          {canManageContent(mod.owner_id) ? (
            <div className="hero-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => onEditMod?.(mod)}
              >
                Edit other mod
              </button>

              {onDeleteMod ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onDeleteMod(mod)}
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
              Other mod downloads are shown only to approved users, moderators, and admins.
            </p>
          </div>
        </div>

        <DownloadLinks value={mod.download_url} canViewLinks={isApprovedViewer} />

        <div className="wrap-actions">
          {canContribute ? (
            <>
              {hasMissingDownload ? (
                <button
                  type="button"
                  className="ghost-button small-btn"
                  onClick={() =>
                    onCreateRequest?.(
                      mod,
                      'missing_link',
                      'Please add a download link for this other mod.'
                    )
                  }
                >
                  Request download link
                </button>
              ) : null}

              <button
                type="button"
                className="ghost-button small-btn"
                onClick={() =>
                  onCreateRequest?.(
                    mod,
                    'dead_link',
                    'Please check this other mod download link.'
                  )
                }
              >
                Report dead link
              </button>

              <button
                type="button"
                className="ghost-button small-btn"
                onClick={() =>
                  onCreateRequest?.(
                    mod,
                    'general_request',
                    ''
                  )
                }
              >
                Request update
              </button>

              {canManageContent(mod.owner_id) && (hasDeadLink || hasMissingDownload) && onResolveLink ? (
                <button
                  type="button"
                  className="secondary-button small-btn"
                  onClick={() => onResolveLink(mod, hasDeadLink ? 'dead_link' : 'missing_link')}
                >
                  Resolve link
                </button>
              ) : null}

              {canManageContent(mod.owner_id) && hasMissingDownload ? (
                <div className="pill danger-pill">Missing download link</div>
              ) : null}

              {canManageContent(mod.owner_id) && hasDeadLink ? (
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
            <p className="subtle-copy">Preview images for this other mod.</p>
          </div>
        </div>

        <OtherModGallery images={images} onOpenImageViewer={onOpenImageViewer} />
      </div>

      <div className="panel soft-panel improved-attire-card">
        <div className="panel-header">
          <div>
            <h2>JSON profile</h2>
            <p className="subtle-copy">Installation profile or related structured config for this mod.</p>
          </div>
        </div>

        <JsonProfileSection value={mod.profile_json} />
      </div>

      <div className="panel soft-panel improved-attire-card">
        <div className="panel-header">
          <div>
            <h2>Request summary</h2>
            <p className="subtle-copy">Open reports and requests for this other mod.</p>
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
    </section>
  )
}