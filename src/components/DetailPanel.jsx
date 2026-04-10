import {
  formatDate,
  requestSummary,
  titleCase,
  parseDownloadLinks,
  getDownloadProvider,
  getDownloadProviderLabel,
  getDownloadProviderMark
} from '../lib/utils'

function statusClass(status) {
  return `status-pill status-${status || 'complete'}`
}

function JsonBrowser({ title, value }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="json-browser-card elevated-card">
      <div className="json-browser-head">
        <strong>{title}</strong>
        <button className="ghost-button small-btn" onClick={() => setOpen((v) => !v)} type="button">
          {open ? 'Hide code' : 'Browse code'}
        </button>
      </div>
      {open ? <pre className="json-box">{value ? JSON.stringify(value, null, 2) : 'No JSON uploaded.'}</pre> : null}
    </div>
  )
}

function DdsDisplay({ url, name }) {
  const [failed, setFailed] = useState(false)

  if (!url) return <div className="render-placeholder">No render uploaded</div>

  return (
    <div className="dds-display">
      {!failed ? (
        <img
          className="gallery-img dds-inline-preview"
          src={url}
          alt={name || 'DDS render'}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="render-placeholder">
          <div className="render-badge">DDS</div>
          <div className="render-name">Preview not available in this browser.</div>
        </div>
      )}
      <a className="secondary-button inline-btn small-btn" href={url} target="_blank" rel="noreferrer">
        Open / download DDS
      </a>
    </div>
  )
}

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

function DownloadLinks({ value }) {
  const links = parseDownloadLinks(value || '')

  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link)
    } catch (err) {
      console.error('Could not copy link', err)
    }
  }

  if (!links.length) {
    return <span className="muted-text">Missing link</span>
  }

  return (
    <div className="download-links-list">
      {links.map((link, index) => {
        const provider = getDownloadProvider(link)
        return (
          <div className={`download-link-chip provider-${provider}`} key={`${link}-${index}`}>
            <a className="download-link-main" href={link} target="_blank" rel="noreferrer">
              <span className="provider-mark">{getDownloadProviderMark(provider)}</span>
              <span className="provider-label">{getDownloadProviderLabel(provider)}</span>
            </a>

            <button
              type="button"
              className="download-chip-copy"
              onClick={() => copyLink(link)}
              title="Copy link"
            >
              Copy
            </button>
          </div>
        )
      })}
    </div>
  )
}

function WrestlerAudioSection({ wrestler }) {
  const entranceMusicFiles = (wrestler.audio_files || []).filter((item) => item.audio_type === 'entrance_music')
  const callnameFiles = (wrestler.audio_files || []).filter((item) => item.audio_type === 'callname')

  function AudioGroup({ title, items }) {
    const [failedIds, setFailedIds] = useState({})

    return (
      <div className="upload-card premium-upload-card">
        <div className="upload-card-header">
          <h5>{title}</h5>
          <p>Stored on the wrestler page. Browser playback may not work for every WEM file, so a download fallback is shown.</p>
        </div>

        {items.length ? (
          <div className="wrestler-audio-list">
            {items.map((item, index) => {
              const key = item.id || item.file_path || `${title}-${index}`
              const failed = failedIds[key]

              return (
                <div className="wrestler-audio-row" key={key}>
                  <div className="wrestler-audio-main">
                    <div className="wrestler-audio-name">{item.file_name || 'Unnamed .wem file'}</div>

                    {!failed && item.file_url ? (
                      <audio
                        className="wrestler-audio-player"
                        controls
                        preload="none"
                        onError={() => setFailedIds((current) => ({ ...current, [key]: true }))}
                      >
                        <source src={item.file_url} />
                      </audio>
                    ) : (
                      <div className="muted-text small-text">
                        Browser playback is not available for this WEM file.
                      </div>
                    )}
                  </div>

                  <div className="wrestler-audio-actions">
                    {item.file_url ? (
                      <a
                        className="ghost-button small-btn"
                        href={item.file_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open / download
                      </a>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="upload-placeholder">No files uploaded</div>
        )}
      </div>
    )
  }

  if (!entranceMusicFiles.length && !callnameFiles.length) return null

  return (
    <section className="panel soft-panel">
      <div className="panel-header">
        <div>
          <h2>Wrestler audio</h2>
          <p className="subtle-copy">Entrance music and announce callnames attached directly to this wrestler.</p>
        </div>
      </div>

      <div className="upload-grid single-column-upload-grid">
        <AudioGroup title="Entrance music (.wem)" items={entranceMusicFiles} />
        <AudioGroup title="Announce callnames (.wem)" items={callnameFiles} />
      </div>
    </section>
  )
}

function WrestlerTitantronSection({ wrestler, canContribute, onOpenImageViewer }) {
  const titantrons = wrestler.titantrons || []

  if (!titantrons.length) return null

  return (
    <section className="panel soft-panel">
      <div className="panel-header">
        <div>
          <h2>Titantrons</h2>
          <p className="subtle-copy">Entrance video packs with screenshots, source game info, and download links.</p>
        </div>
      </div>

      <div className="titantron-display-grid">
        {titantrons.map((item) => {
          const screenshots = item.titantron_images || item.screenshots || []
          const validScreenshots = screenshots.filter((image) => image.image_url || image.url)

          return (
            <article className="attire-card improved-attire-card elevated-card titantron-card" key={item.id}>
              <div className="attire-card-top">
                <div className="attire-title-stack">
                  <h3>{item.title || 'Untitled titantron'}</h3>
                </div>
              </div>

              <div className="visual-block titantron-visual-block">
                <div className="visual-label">Screenshots</div>
                <div className="gallery-grid detail-gallery-grid">
                  {validScreenshots.length ? (
                    validScreenshots.map((image, index) => (
                      <button
                        key={image.id || image.image_path || image.image_url || image.url || `${item.id}-${index}`}
                        type="button"
                        className="gallery-tile gallery-button-reset"
                        onClick={() =>
                          onOpenImageViewer?.(
                            validScreenshots.map((img) => img.image_url || img.url).filter(Boolean),
                            index
                          )
                        }
                      >
                        <img
                          className="gallery-img"
                          src={image.image_url || image.url}
                          alt={image.image_name || image.name || item.title || 'Titantron screenshot'}
                        />
                      </button>
                    ))
                  ) : (
                    <div className="visual-placeholder">No screenshots uploaded</div>
                  )}
                </div>
              </div>

              {canContribute ? (
                <div className="titantron-stats-grid">
                  <div className="titantron-stat-card">
                    <span className="muted-text">Download links</span>
                    <div className="meta-value break-line">
                      <DownloadLinks value={item.download_url} />
                    </div>
                  </div>

                  <div className="titantron-stat-card">
                    <span className="muted-text">Source game</span>
                    <div className="meta-value break-line titantron-source-value">
                      {item.source_game || 'WWE 2K25'}
                    </div>
                  </div>

                  <div className="titantron-stat-card">
                    <span className="muted-text">Screenshots</span>
                    <div className="meta-value break-line titantron-count-value">
                      {validScreenshots.length}
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function CompactRow({
  attire,
  wrestler,
  session,
  canContribute,
  canManageContent,
  installed,
  requestInfo,
  onToggleInstalled,
  onEditAttire,
  onDeleteAttire,
  onCreateRequest,
  onResolveLink,
  onOpenCollectionPicker
}) {
  const downloadLinks = parseDownloadLinks(attire.download_url || '')
  const canEdit = session && canManageContent(attire.owner_id)

  return (
    <div className="compact-attire-row">
      <div className="compact-main">
        <div className="compact-title-row">
          <strong>{attire.name}</strong>
          <span className={statusClass(attire.status)}>{titleCase(attire.status)}</span>
        </div>

        <div className="compact-meta-line">
          <span className="game-badge">
            {attire.source_game}
            {attire.source_game === 'WWE 2K26' ? (
              <span className="latest-badge">NEW</span>
            ) : null}
          </span>
          <span>{titleCase(attire.mod_type)}</span>
          <span>{attire.era || 'No era given'}</span>
          {attire.creator_name ? <span className="creator-badge small-creator-badge">{attire.creator_name}</span> : null}
        </div>
      </div>

      <div className="compact-side">
        <div className="compact-link-wrap">
          {canContribute ? <DownloadLinks value={attire.download_url} /> : null}
        </div>

        <div className="compact-actions-row">
          {canContribute ? (
            <button
              className={installed ? 'primary-button small-btn' : 'secondary-button small-btn'}
              disabled={!session}
              onClick={() => onToggleInstalled(attire)}
              type="button"
            >
              {installed ? 'Installed' : 'Install'}
            </button>
          ) : null}

          {canContribute && onOpenCollectionPicker ? (
            <button
              className={`ghost-button small-btn ${attire.inCollection ? 'collection-btn-active' : ''}`}
              disabled={!session}
              onClick={() =>
                onOpenCollectionPicker?.({
                  ...attire,
                  id: attire.id,
                  modType: 'attire'
                })
              }
              title={
                attire.inCollection
                  ? attire.collectionNames?.join(', ')
                  : 'Add to collection'
              }
              type="button"
            >
              {attire.inCollection
                ? `In ${attire.collectionCount} collection${attire.collectionCount === 1 ? '' : 's'}`
                : 'Add to collection'}
            </button>
          ) : null}

          {canEdit ? (
            <>
              <button className="ghost-button small-btn" onClick={() => onEditAttire(attire)} type="button">
                Edit
              </button>
              {onDeleteAttire ? (
                <button className="ghost-button small-btn" onClick={() => onDeleteAttire(attire)} type="button">
                  Delete
                </button>
              ) : null}
            </>
          ) : null}

          {canContribute ? (
            downloadLinks.length ? (
              downloadLinks.map((link, index) => {
                const provider = getDownloadProvider(link)
                return (
                  <button
                    key={`${link}-${index}`}
                    className={`ghost-button small-btn provider-${provider}`}
                    disabled={!session}
                    onClick={() =>
                      onCreateRequest(
                        wrestler.id,
                        attire.id,
                        'dead_link',
                        wrestler.wrestler_name,
                        `${attire.name} [${getDownloadProviderLabel(provider)}]`,
                        `Dead link reported: ${link}`
                      )
                    }
                    type="button"
                  >
                    Report {getDownloadProviderLabel(provider)}
                  </button>
                )
              })
            ) : (
              <button
                className="ghost-button small-btn"
                disabled={!session}
                onClick={() =>
                  onCreateRequest(
                    wrestler.id,
                    attire.id,
                    'missing_link',
                    wrestler.wrestler_name,
                    attire.name
                  )
                }
                type="button"
              >
                Request link
              </button>
            )
          ) : null}

          {canContribute && (requestInfo.deadLinks > 0 || !attire.download_url?.trim()) ? (
            <button
              className="secondary-button small-btn"
              disabled={!session}
              onClick={() =>
                onResolveLink(
                  wrestler,
                  attire,
                  requestInfo.deadLinks > 0 ? 'dead_link' : 'missing_link'
                )
              }
              type="button"
            >
              Fix link
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function DetailPanel({
  wrestler,
  session,
  canContribute,
  canManageContent,
  installedIds,
  onAddAttire,
  onEditWrestler,
  onEditAttire,
  onDeleteAttire,
  onToggleInstalled,
  onCreateRequest,
  onResolveLink,
  attireViewMode,
  setAttireViewMode,
  onOpenCollectionPicker,
  onOpenImageViewer
}) {

  if (!wrestler) {
    return <section className="panel soft-panel empty-state">Choose a wrestler to browse the database.</section>
  }

  const canEditWrestler = session && canManageContent(wrestler.owner_id)

  return (
    <div className="detail-stack">
      <section className="panel detail-hero">
        <div className="detail-heading-row split-on-mobile">
          <div className="hero-id-wrap">
            {wrestler.headshot_url ? (
              <button
                type="button"
                className="hero-headshot-button"
                onClick={() => onOpenImageViewer?.([wrestler.headshot_url], 0)}
              >
                <img className="hero-headshot" src={wrestler.headshot_url} alt={wrestler.wrestler_name} />
              </button>
            ) : (
              <div className="hero-headshot hero-headshot-placeholder">
                {(wrestler.wrestler_name || '?').slice(0, 2).toUpperCase()}
              </div>
            )}

            <div>
              <div className="eyebrow">Wrestler page</div>
              <h2>{wrestler.wrestler_name}</h2>
              <p className="hero-copy compact-copy">
                Browse public attire mods for this wrestler, sorted by era or appearance date when the attire name includes one.
              </p>
            </div>
          </div>

          <div className="hero-actions">
            {canContribute ? (
              <button className="primary-button" onClick={() => onAddAttire(wrestler)} disabled={!session} type="button">
                Add attire mod
              </button>
            ) : null}

            {canEditWrestler ? (
              <button className="secondary-button" onClick={() => onEditWrestler(wrestler)} type="button">
                Edit wrestler
              </button>
            ) : null}
          </div>
        </div>

        <div className="mini-stats mini-stats-three">
          <div><span>Attire mods</span><strong>{wrestler.attires?.length || 0}</strong></div>
          <div><span>Open requests</span><strong>{(wrestler.requests || []).filter((item) => item.status === 'open').length}</strong></div>
          <div><span>Updated</span><strong>{formatDate(wrestler.updated_at)}</strong></div>
        </div>

        {wrestler.notes ? <div className="note-box">{wrestler.notes}</div> : null}
      </section>

      <WrestlerAudioSection wrestler={wrestler} />

      <WrestlerTitantronSection
        wrestler={wrestler}
        canContribute={canContribute}
        onOpenImageViewer={onOpenImageViewer}
      />

      <section className="panel soft-panel">
        <div className="panel-header with-actions">
          <div>
            <h2>Attire mods</h2>
            <p className="subtle-copy">Switch between a rich gallery view and a compact database-style list.</p>
          </div>

          <Toggle
            value={attireViewMode}
            onChange={setAttireViewMode}
            options={[
              { value: 'gallery', label: 'Gallery' },
              { value: 'compact', label: 'Compact' }
            ]}
          />
        </div>

        {attireViewMode === 'compact' ? (
          <div className="compact-attire-table">
            {(wrestler.attires || []).length === 0 ? (
              <div className="empty-state small-empty">No attire mods added yet.</div>
            ) : (
              (wrestler.attires || []).map((attire) => {
                const installed = installedIds?.has ? installedIds.has(attire.id) : false
                const requestInfo = requestSummary(wrestler.requests || [], 'attire_id', attire.id)

                return (
                  <CompactRow
                    key={attire.id}
                    attire={attire}
                    wrestler={wrestler}
                    session={session}
                    canContribute={canContribute}
                    canManageContent={canManageContent}
                    installed={installed}
                    requestInfo={requestInfo}
                    onToggleInstalled={onToggleInstalled}
                    onEditAttire={onEditAttire}
                    onDeleteAttire={onDeleteAttire}
                    onCreateRequest={onCreateRequest}
                    onResolveLink={onResolveLink}
                    onOpenCollectionPicker={onOpenCollectionPicker}
                  />
                )
              })
            )}
          </div>
        ) : (
          <div className="attire-grid single-attire-grid">
            {(wrestler.attires || []).length === 0 ? (
              <div className="empty-state small-empty">No attire mods added yet.</div>
            ) : (
              (wrestler.attires || []).map((attire) => {
                const installed = installedIds?.has ? installedIds.has(attire.id) : false
                const requestInfo = requestSummary(wrestler.requests || [], 'attire_id', attire.id)
                const screenshots = attire.attire_images || []
                const validScreenshots = screenshots.filter((image) => image.image_url || image.url)
                const downloadLinks = parseDownloadLinks(attire.download_url || '')
                const canEditAttire = session && canManageContent(attire.owner_id)

                return (
                  <article className="attire-card improved-attire-card elevated-card" key={attire.id}>
                    <div className="attire-card-top">
                      <div className="attire-title-stack">
                        <h3>{attire.name}</h3>
                        {attire.creator_name ? (
                          <div className="creator-highlight-row">
                            <span className="creator-label">Mod creator</span>
                            <span className="creator-badge prominent-creator-badge">{attire.creator_name}</span>
                          </div>
                        ) : null}

                        <div className="list-meta wrap-meta">
                          <span>{attire.era || 'No era given'}</span>
                          <span className="game-badge">
                            {attire.source_game}
                            {attire.source_game === 'WWE 2K26' ? (
                              <span className="latest-badge">NEW</span>
                            ) : null}
                          </span>
                          <span>{titleCase(attire.mod_type)}</span>
                        </div>
                      </div>

                      <span className={statusClass(attire.status)}>{titleCase(attire.status)}</span>
                    </div>

                    <div className="attire-visuals single-column-visuals">
                      <div className="visual-block">
                        <div className="visual-label">Screenshots</div>
                        <div className="gallery-grid detail-gallery-grid">
                          {validScreenshots.length ? (
                            validScreenshots.map((image, index) => (
                              <button
                                key={image.id || image.image_path || image.image_url || image.url || `${attire.id}-${index}`}
                                type="button"
                                className="gallery-tile gallery-button-reset"
                                onClick={() =>
                                  onOpenImageViewer?.(
                                    validScreenshots.map((img) => img.image_url || img.url).filter(Boolean),
                                    index
                                  )
                                }
                              >
                                <img className="gallery-img" src={image.image_url || image.url} alt={image.image_name || image.name || attire.name} />
                              </button>
                            ))
                          ) : (
                            <div className="visual-placeholder">No screenshots uploaded</div>
                          )}
                        </div>
                      </div>

                      <div className="visual-block">
                        <div className="visual-label">DDS render</div>
                        <DdsDisplay url={attire.render_dds_url} name={attire.render_dds_name} />
                      </div>
                    </div>

                    {canContribute ? (
                      <div className="split-meta">
                        <div>
                          <span className="muted-text">Download links</span>
                          <div className="meta-value break-line">
                            <DownloadLinks value={attire.download_url} />
                          </div>
                        </div>
                        <div>
                          <span className="muted-text">Added</span>
                          <div className="meta-value break-line">{formatDate(attire.created_at)}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="split-meta">
                        <div>
                          <span className="muted-text">Added</span>
                          <div className="meta-value break-line">{formatDate(attire.created_at)}</div>
                        </div>
                      </div>
                    )}

                    {attire.notes ? <div className="note-box compact-note">{attire.notes}</div> : null}

                    <div className="json-grid attire-json-grid">
                      <JsonBrowser title="Moveset / animations" value={attire.moveset_json} />
                      <JsonBrowser title="Hype / DC profile" value={attire.profile_json} />
                    </div>

                    <div className="request-summary-row">
                      <span className="pill">{requestInfo.total} open requests</span>
                      {requestInfo.missingLinks ? <span className="pill">{requestInfo.missingLinks} missing link</span> : null}
                      {requestInfo.deadLinks ? <span className="pill danger-pill">{requestInfo.deadLinks} dead link</span> : null}
                    </div>

                    <div className="attire-actions wrap-actions">
                      {canContribute ? (
                        <button
                          className={`small-btn ${attire.isInstalled ? 'primary-button' : 'secondary-button'}`}
                          disabled={!session}
                          onClick={() => onToggleInstalled(attire)}
                          type="button"
                        >
                          {attire.isInstalled ? 'Installed in my game' : 'Mark installed'}
                        </button>
                      ) : null}

                      {canContribute && onOpenCollectionPicker ? (
                        <button
                          className={`ghost-button small-btn ${attire.inCollection ? 'collection-btn-active' : ''}`}
                          disabled={!session}
                          onClick={() =>
                            onOpenCollectionPicker?.({
                              ...attire,
                              id: attire.id,
                              modType: 'attire'
                            })
                          }
                          title={
                            attire.inCollection
                              ? attire.collectionNames?.join(', ')
                              : 'Add to collection'
                          }
                          type="button"
                        >
                          {attire.inCollection
                            ? `In ${attire.collectionCount} collection${attire.collectionCount === 1 ? '' : 's'}`
                            : 'Add to collection'}
                        </button>
                      ) : null}

                      {canEditAttire ? (
                        <>
                          <button 
                            className="ghost-button small-btn"
                            onClick={() => onEditAttire(attire)}
                            type="button"
                          >
                            Edit
                          </button>
                          {onDeleteAttire ? (
                            <button
                              className="ghost-button small-btn"
                              onClick={() => onDeleteAttire(attire)}
                              type="button"
                            >
                              Delete
                            </button>
                          ) : null}
                        </>
                      ) : null}

                      {canContribute ? (
                        downloadLinks.length ? (
                          downloadLinks.map((link, index) => {
                            const provider = getDownloadProvider(link)
                            return (
                              <button
                                key={`${link}-${index}`}
                                className={`ghost-button small-btn provider-${provider}`}
                                disabled={!session}
                                onClick={() =>
                                  onCreateRequest(
                                    wrestler.id,
                                    attire.id,
                                    'dead_link',
                                    wrestler.wrestler_name,
                                    `${attire.name} [${getDownloadProviderLabel(provider)}]`,
                                    `Dead link reported: ${link}`
                                  )
                                }
                                type="button"
                              >
                                Report {getDownloadProviderLabel(provider)}
                              </button>
                            )
                          })
                        ) : (
                          <button
                            className="ghost-button small-btn"
                            disabled={!session}
                            onClick={() =>
                              onCreateRequest(
                                wrestler.id,
                                attire.id,
                                'missing_link',
                                wrestler.wrestler_name,
                                attire.name
                              )
                            }
                            type="button"
                          >
                            Request link
                          </button>
                        )
                      ) : null}

                      {canContribute && (requestInfo.deadLinks > 0 || !attire.download_url?.trim()) ? (
                        <button
                          className="secondary-button small-btn"
                          disabled={!session}
                          onClick={() =>
                            onResolveLink(
                              wrestler,
                              attire,
                              requestInfo.deadLinks > 0 ? 'dead_link' : 'missing_link'
                            )
                          }
                          type="button"
                        >
                          Fix link
                        </button>
                      ) : null}
                    </div>
                  </article>
                )
              })
            )}
          </div>
        )}
      </section>
    </div>
  )
}