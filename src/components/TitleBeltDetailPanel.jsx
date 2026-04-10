import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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

function TitleGallery({ images = [], onOpenImageViewer }) {
  if (!images.length) {
    return <div className="upload-placeholder">No title screenshots uploaded</div>
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
            key={image.id || image.path || image.url || `title-image-${index}`}
            onClick={() => onOpenImageViewer?.(galleryImages, index)}
          >
            <img
              className="gallery-img"
              src={src}
              alt={image.name || image.image_name || 'Title screenshot'}
            />
          </button>
        )
      })}
    </div>
  )
}

function AudioSection({ files = [] }) {
  if (!files.length) {
    return <div className="upload-placeholder">No audio uploaded yet</div>
  }

  return (
    <div className="wrestler-audio-list">
      {files.map((file) => (
        <div
          key={file.id || file.file_path || file.file_url}
          className="wrestler-audio-row"
        >
          <div className="wrestler-audio-main">
            <div className="wrestler-audio-name">
              {file.file_name || 'Audio file'}
            </div>
            <div className="muted-text small-text">
              {file.audio_type || 'generic'}
            </div>
            {!file.file_url ? (
              <div className="muted-text small-text">
                Audio file uploaded, but preview is unavailable.
              </div>
            ) : null}
          </div>

          <div className="wrestler-audio-actions">
            {file.file_url ? (
              <audio className="wrestler-audio-player" controls src={file.file_url} />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function DdsPreview({ url, name, onOpenImageViewer }) {
  const [failed, setFailed] = useState(false)

  if (!url) {
    return (
      <div className="render-placeholder">
        <div className="render-badge">DDS</div>
        <div className="muted-text">No DDS render uploaded</div>
      </div>
    )
  }

  return (
    <div className="dds-display improved-dds-display">
      {!failed ? (
        <button
          type="button"
          className="gallery-button-reset dds-preview-button"
          onClick={() => onPreview(url)}
        >
          <img
            className="upload-preview dds-inline-preview"
            src={url}
            alt={name || 'DDS render'}
            onError={() => setFailed(true)}
          />
        </button>
      ) : (
        <div className="render-placeholder">
          <div className="render-badge">DDS</div>
          <div className="muted-text">Preview not available in this browser</div>
        </div>
      )}

      <div className="muted-text small-text dds-file-name">
        {name || 'DDS render uploaded'}
      </div>

      <a
        className="ghost-button small-btn"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        Open file
      </a>
    </div>
  )
}

export default function TitleBeltDetailPanel({
  title,
  session,
  currentProfile,
  canContribute,
  canManageContent,
  installedTitleIds,
  onAddTitle,
  onEditTitle,
  onDeleteTitle,
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

  if (!title) {
    return (
      <section className="detail-stack">
        <div className="panel soft-panel empty-state">
          <div>
            <div>Select a title belt to view its details.</div>
            {canContribute && onAddTitle ? (
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="primary-button small-btn"
                  onClick={onAddTitle}
                >
                  Add title belt
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    )
  }

  const images = (title.images || title.title_belt_images || []).map((img) => ({
    ...img,
    url: img.url || img.image_url || ''
  }))

  const audioFiles = (title.audio_files || title.title_belt_audio_files || []).map((file) => ({
    ...file,
    file_url: file.file_url || ''
  }))

  const requests = title.requests || []
  const openRequests = requests.filter((item) => item.status === 'open')
  const requestInfo = requestSummary(openRequests, 'title_belt_id', title.id)
  const hasMissingDownload = !String(title.download_url || '').trim()
  const hasDeadLink = openRequests.some((item) => item.request_type === 'dead_link')

  return (
    <section className="detail-stack">
      <div className="panel detail-hero hero-card hero-card-improved">
        <div className="hero-copy compact-copy">
          <div className="eyebrow">Title belt mod</div>
          <h1>{title.name || 'Unknown title belt'}</h1>

          <div className="creator-highlight-row">
            <span className="creator-label">Creator</span>
            <span className="creator-badge prominent-creator-badge">
              {title.creator_name || 'Unknown creator'}
            </span>
          </div>

          {title.notes ? (
            <div className="note-box">
              {title.notes}
            </div>
          ) : null}

          <div className="mini-stats mini-stats-three">
            <div>
              <span>Screenshots</span>
              <strong>{images.length}</strong>
            </div>
            <div>
              <span>Audio files</span>
              <strong>{audioFiles.length}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>{formatDate(title.updated_at)}</strong>
            </div>
          </div>
        </div>

        <div className="hero-side-stack">
          <div className="hero-collection-pill">
            <span className="game-badge">
              {title.source_game || 'WWE 2K25'}
              {title.source_game === 'WWE 2K26' ? (
                <span className="latest-badge">NEW</span>
              ) : null}
            </span>
          </div>

          {canContribute ? (
            <div className="hero-actions">
              <button
                type="button"
                className={`ghost-button small-btn ${title.isInstalled ? 'installed-btn-active' : ''}`}
                onClick={() => onToggleInstalled?.(title)}
                >
                {title.isInstalled ? 'Installed in my game' : 'Mark installed'}
                </button>

                {onOpenCollectionPicker ? (
                <button
                    type="button"
                    className={`ghost-button small-btn ${title.inCollection ? 'collection-btn-active' : ''}`}
                    onClick={() =>
                    onOpenCollectionPicker({
                        ...title,
                        modType: 'title',
                        id: title.id
                    })
                    }
                    title={
                    title.inCollection
                        ? title.collectionNames?.join(', ')
                        : 'Add to collection'
                    }
                >
                    {title.inCollection
                    ? `In ${title.collectionCount} collection${title.collectionCount === 1 ? '' : 's'}`
                    : 'Add to collection'}
                </button>
              ) : null}
            </div>
          ) : null}

          {canManageContent(title.owner_id) ? (
            <div className="hero-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => onEditTitle?.(title)}
              >
                Edit title belt
              </button>

              {onDeleteTitle ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onDeleteTitle(title)}
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
              Title belt downloads are shown only to approved users, moderators, and admins.
            </p>
          </div>
        </div>

        <DownloadLinks value={title.download_url} canViewLinks={isApprovedViewer} />

        <div className="wrap-actions">
            {canContribute ? (
                <>
                {hasMissingDownload ? (
                    <button
                    type="button"
                    className="ghost-button small-btn"
                    onClick={() =>
                        onCreateRequest?.(
                        title,
                        'missing_link',
                        'Please add a download link for this title belt.'
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
                        title,
                        'dead_link',
                        'Please check this title belt download link.'
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
                        title,
                        'general_request',
                        ''
                    )
                    }
                >
                    Request update
                </button>

                {canManageContent(title.owner_id) && (hasDeadLink || hasMissingDownload) && onResolveLink ? (
                    <button
                    type="button"
                    className="secondary-button small-btn"
                    onClick={() => onResolveLink(title, hasDeadLink ? 'dead_link' : 'missing_link')}
                    >
                    Resolve link
                    </button>
                ) : null}

                {canManageContent(title.owner_id) && hasMissingDownload ? (
                    <div className="pill danger-pill">Missing download link</div>
                ) : null}

                {canManageContent(title.owner_id) && hasDeadLink ? (
                    <div className="pill warning-pill">Dead link needs review</div>
                ) : null}
                </>
            ) : null}
            </div>
      </div>

      <div className="panel soft-panel improved-attire-card">
        <div className="panel-header">
          <div>
            <h2>DDS render</h2>
            <p className="subtle-copy">Preview for the title belt render file.</p>
          </div>
        </div>

        <DdsPreview
            url={title.render_dds_url}
            name={title.render_dds_name || `${title.name} render`}
            onOpenImageViewer={onOpenImageViewer}
        />
      </div>

      <div className="panel soft-panel improved-attire-card">
        <div className="panel-header">
          <div>
            <h2>Screenshots</h2>
            <p className="subtle-copy">Preview images for this title belt mod.</p>
          </div>
        </div>

        <TitleGallery images={images} onOpenImageViewer={onOpenImageViewer} />
      </div>

      <div className="panel soft-panel improved-attire-card">
        <div className="panel-header">
          <div>
            <h2>Audio files</h2>
            <p className="subtle-copy">Uploaded WEM audio files for this title belt.</p>
          </div>
        </div>

        <AudioSection files={audioFiles} />
      </div>

      <div className="panel soft-panel improved-attire-card">
        <div className="panel-header">
          <div>
            <h2>Request summary</h2>
            <p className="subtle-copy">Open reports and requests for this title belt.</p>
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