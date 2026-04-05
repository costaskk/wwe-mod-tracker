import { formatDate, requestSummary } from '../lib/utils'

function statusClass(status) {
  return `status-pill status-${status || 'complete'}`
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
  onCreateRequest
}) {
  if (!wrestler) {
    return <section className="panel soft-panel empty-state">Choose a wrestler to browse the database.</section>
  }

  const attireGap = Math.max(0, (wrestler.target_attire_count || 0) - (wrestler.attires?.length || 0))

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
                Browse public attire mods for this wrestler, sorted by era or appearance date when the attire name includes one. Users can add mods, screenshots, renders, requests, and install markers.
              </p>
            </div>
          </div>

          <div className="hero-actions">
            <button className="primary-button" onClick={() => onAddAttire(wrestler)} disabled={!session}>Add attire mod</button>
            <button className="secondary-button" onClick={() => onEditWrestler(wrestler)} disabled={!session || session.user.id !== wrestler.owner_id}>Edit wrestler</button>
          </div>
        </div>

        <div className="mini-stats">
          <div><span>Attire mods</span><strong>{wrestler.attires?.length || 0}</strong></div>
          <div><span>Target count</span><strong>{wrestler.target_attire_count || 0}</strong></div>
          <div><span>Attire gap</span><strong>{attireGap}</strong></div>
          <div><span>Updated</span><strong>{formatDate(wrestler.updated_at)}</strong></div>
        </div>

        {wrestler.notes ? <div className="note-box">{wrestler.notes}</div> : null}
      </section>

      <section className="panel soft-panel">
        <div className="panel-header">
          <h2>Moveset and profile files</h2>
        </div>
        <div className="json-grid">
          <div>
            <h4>Moveset / animations</h4>
            <pre className="json-box">{wrestler.moveset_json ? JSON.stringify(wrestler.moveset_json, null, 2) : 'No JSON uploaded.'}</pre>
          </div>
          <div>
            <h4>Hype / DC profile</h4>
            <pre className="json-box">{wrestler.profile_json ? JSON.stringify(wrestler.profile_json, null, 2) : 'No JSON uploaded.'}</pre>
          </div>
        </div>
      </section>

      <section className="panel soft-panel">
        <div className="panel-header with-actions">
          <div>
            <h2>Attire mods</h2>
            <p className="subtle-copy">Download links, screenshots, DDS renders, creator, and install state all live on each attire.</p>
          </div>
        </div>

        <div className="attire-grid">
          {(wrestler.attires || []).length === 0 ? (
            <div className="empty-state small-empty">No attire mods added yet.</div>
          ) : (wrestler.attires || []).map((attire) => {
            const installed = installedIds.has(attire.id)
            const requestInfo = requestSummary(wrestler.requests || [], attire.id)
            const screenshots = attire.attire_images || []
            return (
              <article className="attire-card improved-attire-card" key={attire.id}>
                <div className="attire-card-top">
                  <div>
                    <h3>{attire.name}</h3>
                    <div className="list-meta wrap-meta">
                      <span>{attire.era || 'No era given'}</span>
                      <span>{attire.source_game}</span>
                      <span>{attire.mod_type}</span>
                      {attire.creator_name ? <span>by {attire.creator_name}</span> : null}
                    </div>
                  </div>
                  <span className={statusClass(attire.status)}>{attire.status}</span>
                </div>

                <div className="gallery-grid">
                  {screenshots.length ? screenshots.slice(0, 4).map((image) => (
                    <a key={image.id} href={image.image_url} target="_blank" rel="noreferrer" className="gallery-tile">
                      <img className="gallery-img" src={image.image_url} alt={image.image_name || attire.name} />
                    </a>
                  )) : <div className="visual-placeholder">No screenshots uploaded</div>}
                </div>

                <div className="split-meta">
                  <div>
                    <span className="muted-text">Download</span>
                    <div className="meta-value break-line">{attire.download_url ? <a href={attire.download_url} target="_blank" rel="noreferrer">Open link</a> : 'Missing link'}</div>
                  </div>
                  <div>
                    <span className="muted-text">DDS render</span>
                    <div className="meta-value break-line">{attire.render_dds_url ? <a href={attire.render_dds_url} target="_blank" rel="noreferrer">{attire.render_dds_name || 'Download DDS'}</a> : 'No render uploaded'}</div>
                  </div>
                </div>

                {attire.notes ? <div className="note-box compact-note">{attire.notes}</div> : null}

                <div className="request-summary-row">
                  <span className="pill">{requestInfo.total} open requests</span>
                  {requestInfo.missingLinks ? <span className="pill">{requestInfo.missingLinks} missing link</span> : null}
                  {requestInfo.deadLinks ? <span className="pill danger-pill">{requestInfo.deadLinks} dead link</span> : null}
                </div>

                <div className="attire-actions wrap-actions">
                  <button className={installed ? 'primary-button small-btn' : 'secondary-button small-btn'} disabled={!session} onClick={() => onToggleInstalled(attire, installed)}>
                    {installed ? 'Installed in my game' : 'Mark installed'}
                  </button>
                  <button className="ghost-button small-btn" disabled={!session || session.user.id !== attire.owner_id} onClick={() => onEditAttire(attire)}>Edit</button>
                  <button className="ghost-button small-btn" disabled={!session || session.user.id !== attire.owner_id} onClick={() => onDeleteAttire(attire)}>Delete</button>
                  <button className="ghost-button small-btn" disabled={!session} onClick={() => onCreateRequest(wrestler.id, attire.id, attire.download_url ? 'dead_link' : 'missing_link')}>
                    {attire.download_url ? 'Report dead link' : 'Request link'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
