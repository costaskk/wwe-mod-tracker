
import { useState } from 'react'
import { formatDate, requestSummary, titleCase } from '../lib/utils'

function statusClass(status) {
  return `status-pill status-${status || 'complete'}`
}

function JsonBrowser({ title, value }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="json-browser-card elevated-card">
      <div className="json-browser-head">
        <strong>{title}</strong>
        <button className="ghost-button small-btn" onClick={() => setOpen((v) => !v)}>
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
        <img className="gallery-img dds-inline-preview" src={url} alt={name || 'DDS render'} onError={() => setFailed(true)} />
      ) : (
        <div className="render-placeholder">
          <div className="render-badge">DDS</div>
          <div className="render-name">Preview not available in this browser.</div>
        </div>
      )}
      <a className="secondary-button inline-btn small-btn" href={url} target="_blank" rel="noreferrer">Open / download DDS</a>
    </div>
  )
}

function Toggle({ value, onChange, options }) {
  return (
    <div className="view-toggle">
      {options.map((opt) => (
        <button key={opt.value} type="button" className={value === opt.value ? 'active' : ''} onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function CompactRow({ attire, wrestler, session, installed, requestInfo, onToggleInstalled, onEditAttire, onDeleteAttire, onCreateRequest, onOpenCollectionPicker }) {
  return (
    <div className="compact-attire-row">
      <div className="compact-main">
        <div className="compact-title-row">
          <strong>{attire.name}</strong>
          <span className={statusClass(attire.status)}>{titleCase(attire.status)}</span>
        </div>
        <div className="compact-meta-line">
          <span>{attire.source_game}</span>
          <span>{titleCase(attire.mod_type)}</span>
          <span>{attire.era || 'No era given'}</span>
          {attire.creator_name ? <span className="creator-badge small-creator-badge">{attire.creator_name}</span> : null}
        </div>
      </div>
      <div className="compact-side">
        <div className="compact-link-wrap">{attire.download_url ? <a href={attire.download_url} target="_blank" rel="noreferrer">Download</a> : <span className="muted-text">Missing link</span>}</div>
        <div className="compact-actions-row">
          <button className={installed ? 'primary-button small-btn' : 'secondary-button small-btn'} disabled={!session} onClick={() => onToggleInstalled(attire, installed)}>
            {installed ? 'Installed' : 'Install'}
          </button>
          <button className="ghost-button small-btn" disabled={!session} onClick={() => onOpenCollectionPicker(attire)}>Collection</button>
          <button className="ghost-button small-btn" disabled={!session || session.user.id !== attire.owner_id} onClick={() => onEditAttire(attire)}>Edit</button>
          <button className="ghost-button small-btn" disabled={!session || session.user.id !== attire.owner_id} onClick={() => onDeleteAttire(attire)}>Delete</button>
          <button className="ghost-button small-btn" disabled={!session} onClick={() => onCreateRequest(wrestler.id, attire.id, attire.download_url ? 'dead_link' : 'missing_link', wrestler.wrestler_name, attire.name)}>
            {requestInfo.deadLinks || attire.download_url ? 'Dead link' : 'Request link'}
          </button>
          {(requestInfo.deadLinks > 0 || !attire.download_url?.trim()) ? (
            <button className="secondary-button small-btn" disabled={!session} onClick={() => onResolveLink(wrestler, attire, requestInfo.deadLinks > 0 ? 'dead_link' : 'missing_link')}>
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
  onOpenCollectionPicker
}) {
  if (!wrestler) {
    return <section className="panel soft-panel empty-state">Choose a wrestler to browse the database.</section>
  }


  return (
    <div className="detail-stack">
      <section className="panel detail-hero">
        <div className="detail-heading-row split-on-mobile">
          <div className="hero-id-wrap">
            {wrestler.headshot_url ? <img className="hero-headshot" src={wrestler.headshot_url} alt={wrestler.wrestler_name} /> : <div className="hero-headshot hero-headshot-placeholder">{wrestler.wrestler_name.slice(0, 2).toUpperCase()}</div>}
            <div>
              <div className="eyebrow">Wrestler page</div>
              <h2>{wrestler.wrestler_name}</h2>
              <p className="hero-copy compact-copy">
                Browse public attire mods for this wrestler, sorted by era or appearance date when the attire name includes one.
                Users can add mods, screenshots, renders, JSON profiles, requests, install markers, and save attires into collections.
              </p>
            </div>
          </div>

          <div className="hero-actions">
            <button className="primary-button" onClick={() => onAddAttire(wrestler)} disabled={!session}>Add attire mod</button>
            <button className="secondary-button" onClick={() => onEditWrestler(wrestler)} disabled={!session || session.user.id !== wrestler.owner_id}>Edit wrestler</button>
          </div>
        </div>

        <div className="mini-stats mini-stats-three">
          <div><span>Attire mods</span><strong>{wrestler.attires?.length || 0}</strong></div>
          <div><span>Open requests</span><strong>{(wrestler.requests || []).filter((item) => item.status === 'open').length}</strong></div>
          <div><span>Updated</span><strong>{formatDate(wrestler.updated_at)}</strong></div>
        </div>

        {wrestler.notes ? <div className="note-box">{wrestler.notes}</div> : null}
      </section>

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
            ) : (wrestler.attires || []).map((attire) => {
              const installed = installedIds.has(attire.id)
              const requestInfo = requestSummary(wrestler.requests || [], attire.id)
              return (
                <CompactRow
                  key={attire.id}
                  attire={attire}
                  wrestler={wrestler}
                  session={session}
                  installed={installed}
                  requestInfo={requestInfo}
                  onToggleInstalled={onToggleInstalled}
                  onEditAttire={onEditAttire}
                  onDeleteAttire={onDeleteAttire}
                  onCreateRequest={onCreateRequest}
                  onOpenCollectionPicker={onOpenCollectionPicker}
                />
              )
            })}
          </div>
        ) : (
          <div className="attire-grid single-attire-grid">
            {(wrestler.attires || []).length === 0 ? (
              <div className="empty-state small-empty">No attire mods added yet.</div>
            ) : (wrestler.attires || []).map((attire) => {
              const installed = installedIds.has(attire.id)
              const requestInfo = requestSummary(wrestler.requests || [], attire.id)
              const screenshots = attire.attire_images || []
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
                        <span>{attire.source_game}</span>
                        <span>{titleCase(attire.mod_type)}</span>
                      </div>
                    </div>
                    <span className={statusClass(attire.status)}>{titleCase(attire.status)}</span>
                  </div>

                  <div className="attire-visuals single-column-visuals">
                    <div className="visual-block">
                      <div className="visual-label">Screenshots</div>
                      <div className="gallery-grid detail-gallery-grid">
                        {screenshots.length ? screenshots.map((image) => (
                          <a key={image.id} href={image.image_url} target="_blank" rel="noreferrer" className="gallery-tile">
                            <img className="gallery-img" src={image.image_url} alt={image.image_name || attire.name} />
                          </a>
                        )) : <div className="visual-placeholder">No screenshots uploaded</div>}
                      </div>
                    </div>

                    <div className="visual-block">
                      <div className="visual-label">DDS render</div>
                      <DdsDisplay url={attire.render_dds_url} name={attire.render_dds_name} />
                    </div>
                  </div>

                  <div className="split-meta">
                    <div>
                      <span className="muted-text">Download</span>
                      <div className="meta-value break-line">{attire.download_url ? <a href={attire.download_url} target="_blank" rel="noreferrer">Open link</a> : 'Missing link'}</div>
                    </div>
                    <div>
                      <span className="muted-text">Added</span>
                      <div className="meta-value break-line">{formatDate(attire.created_at)}</div>
                    </div>
                  </div>

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
                    <button className={installed ? 'primary-button small-btn' : 'secondary-button small-btn'} disabled={!session} onClick={() => onToggleInstalled(attire, installed)}>
                      {installed ? 'Installed in my game' : 'Mark installed'}
                    </button>
                    <button className="ghost-button small-btn" disabled={!session} onClick={() => onOpenCollectionPicker(attire)}>Save to collection</button>
                    <button className="ghost-button small-btn" disabled={!session || session.user.id !== attire.owner_id} onClick={() => onEditAttire(attire)}>Edit</button>
                    <button className="ghost-button small-btn" disabled={!session || session.user.id !== attire.owner_id} onClick={() => onDeleteAttire(attire)}>Delete</button>
                    <button className="ghost-button small-btn" disabled={!session} onClick={() => onCreateRequest(wrestler.id, attire.id, attire.download_url ? 'dead_link' : 'missing_link', wrestler.wrestler_name, attire.name)}>
                      {attire.download_url ? 'Report dead link' : 'Request link'}
                    </button>
                    {(requestInfo.deadLinks > 0 || !attire.download_url?.trim()) ? (
                      <button className="secondary-button small-btn" disabled={!session} onClick={() => onResolveLink(wrestler, attire, requestInfo.deadLinks > 0 ? 'dead_link' : 'missing_link')}>
                        Fix link
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}

      <section className="panel soft-panel">
        <div className="panel-header">
          <div>
            <h2>Link issues</h2>
            <p className="subtle-copy">Browse missing or dead links for this wrestler and resolve them directly from the app.</p>
          </div>
        </div>

        <div className="link-issues-list">
          {(() => {
            const issues = (wrestler.attires || []).flatMap((attire) => {
              const summary = requestSummary(wrestler.requests || [], attire.id)
              const missingIssue = !attire.download_url?.trim()
              const deadIssue = summary.deadLinks > 0
              if (!missingIssue && !deadIssue) return []
              return [{
                attire,
                summary,
                issueType: deadIssue ? 'dead_link' : 'missing_link'
              }]
            })

            return issues.length ? issues.map((item) => (
              <div className="link-issue-card elevated-card" key={item.attire.id}>
                <div className="link-issue-main">
                  <div className="link-issue-title-row">
                    <strong>{item.attire.name}</strong>
                    <span className={`pill ${item.issueType === 'dead_link' ? 'danger-pill' : ''}`}>
                      {item.issueType === 'dead_link' ? 'Reported dead link' : 'Missing link'}
                    </span>
                  </div>
                  <div className="list-meta wrap-meta">
                    <span>{item.attire.source_game}</span>
                    <span>{item.attire.era || 'No era given'}</span>
                    {item.attire.creator_name ? <span>{item.attire.creator_name}</span> : null}
                    <span>{item.summary.total} open requests</span>
                  </div>
                  <div className="muted-text break-line">
                    Current link: {item.attire.download_url ? item.attire.download_url : 'No link saved yet'}
                  </div>
                </div>
                <div className="link-issue-actions">
                  <button className="secondary-button small-btn" disabled={!session} onClick={() => onResolveLink(wrestler, item.attire, item.issueType)}>
                    Fix link
                  </button>
                  <button className="ghost-button small-btn" disabled={!session} onClick={() => onCreateRequest(wrestler.id, item.attire.id, item.issueType, wrestler.wrestler_name, item.attire.name)}>
                    Add note
                  </button>
                  <button className="ghost-button small-btn" onClick={() => onEditAttire(item.attire)} disabled={!session || session.user.id !== item.attire.owner_id}>
                    Edit attire
                  </button>
                </div>
              </div>
            )) : <div className="empty-state small-empty">No open link issues for this wrestler.</div>
          })()}
        </div>
      </section>
      </section>
    </div>
  )
}
