import { formatDate, requestSummary } from '../lib/utils'

function statusClass(status) {
  return `status-pill status-${status || 'complete'}`
}

export default function DetailPanel({
  wrestler, session, installedIds, onAddAttire, onEditWrestler, onEditAttire, onDeleteAttire, onToggleInstalled, onCreateRequest
}) {
  if (!wrestler) {
    return <section className="panel soft-panel empty-state">Choose a wrestler to browse the database.</section>
  }

  const attireGap = Math.max(0, (wrestler.target_attire_count || 0) - (wrestler.attires?.length || 0))

  return (
    <div className="detail-stack">
      <section className="panel detail-hero">
        <div className="detail-heading-row">
          <div>
            <div className="eyebrow">Wrestler page</div>
            <h2>{wrestler.wrestler_name}</h2>
            <p className="hero-copy compact-copy">
              Public wrestler listing with community-contributed attire mods. Open the attire cards to see previews, renders, downloads, install state, and requests.
            </p>
          </div>

          <div className="hero-actions">
            <button className="primary-button" onClick={() => onAddAttire(wrestler)} disabled={!session}>Add attire mod</button>
            <button className="secondary-button" onClick={() => onEditWrestler(wrestler)} disabled={!session || session.user.id !== wrestler.owner_id}>Edit wrestler</button>
          </div>
        </div>

        <div className="mini-stats">
          <div><span>Attire mods</span><strong>{wrestler.attires?.length || 0}</strong></div>
          <div><span>Target count</span><strong>{wrestler.target_attire_count || 0}</strong></div>
          <div><span>Gap</span><strong>{attireGap}</strong></div>
          <div><span>Open requests</span><strong>{(wrestler.requests || []).filter(item => item.status === 'open').length}</strong></div>
        </div>

        {wrestler.tags?.length ? (
          <div className="tags-row tag-cluster">
            {wrestler.tags.map((tag) => <span className="pill dark" key={tag}>#{tag}</span>)}
          </div>
        ) : null}

        {wrestler.notes ? <div className="note-box">{wrestler.notes}</div> : null}
      </section>

      <section className="panel soft-panel">
        <div className="panel-header with-actions">
          <div>
            <h3>Attire mods</h3>
            <p className="subtle-copy">Automatically sorted by appearance date when a year is found in the attire name.</p>
          </div>
        </div>

        <div className="attire-grid">
          {(wrestler.attires || []).length === 0 ? (
            <div className="empty-state small-empty">No attire mods added yet.</div>
          ) : wrestler.attires.map((attire) => {
            const requests = requestSummary(wrestler.requests || [], attire.id)
            const isInstalled = installedIds.has(attire.id)

            return (
              <article className="attire-card improved-attire-card" key={attire.id}>
                <div className="attire-card-top">
                  <div>
                    <h3>{attire.name}</h3>
                    <div className="small-text muted-text">
                      {attire.era || 'No era set'} {attire.slot_name ? `• Slot ${attire.slot_name}` : ''}
                    </div>
                  </div>
                  <span className={statusClass(attire.status)}>{attire.status?.replace('_', ' ')}</span>
                </div>

                <div className="attire-visuals">
                  <div className="visual-block">
                    <div className="visual-label">Preview</div>
                    {attire.preview_image_url ? (
                      <img src={attire.preview_image_url} alt={attire.name} />
                    ) : (
                      <div className="visual-placeholder">No preview image uploaded</div>
                    )}
                  </div>

                  <div className="visual-block render-block">
                    <div className="visual-label">DDS render</div>
                    {attire.render_dds_url ? (
                      <div className="render-tile">
                        <div className="render-badge">DDS</div>
                        <div className="render-name">{attire.render_dds_name || 'Render file'}</div>
                        <a className="secondary-button inline-btn" href={attire.render_dds_url} target="_blank" rel="noreferrer">Download render</a>
                      </div>
                    ) : (
                      <div className="render-placeholder">No DDS render uploaded</div>
                    )}
                  </div>
                </div>

                <div className="attire-meta split-meta">
                  <div><strong>Creator:</strong> {attire.creator_name || '—'}</div>
                  <div><strong>Type:</strong> {attire.mod_type || '—'}</div>
                  <div><strong>Source:</strong> {attire.source_game || '—'}</div>
                  <div><strong>Game patch:</strong> {attire.game_version || '—'}</div>
                  <div><strong>Added:</strong> {formatDate(attire.created_at)}</div>
                  <div><strong>Open requests:</strong> {requests.total}</div>
                  <div className="wide-meta"><strong>Notes:</strong> {attire.notes || '—'}</div>
                  <div className="wide-meta">
                    <strong>Download:</strong>{' '}
                    {attire.download_url ? (
                      <a href={attire.download_url} target="_blank" rel="noreferrer">{attire.download_url}</a>
                    ) : (
                      <span className="warning-text">No link saved</span>
                    )}
                  </div>
                </div>

                <div className="tag-cluster">
                  <button className={isInstalled ? 'primary-button small-btn' : 'secondary-button small-btn'} onClick={() => onToggleInstalled(attire)} disabled={!session}>
                    {isInstalled ? 'Installed in my game' : 'Mark as installed'}
                  </button>

                  <button className="secondary-button small-btn" onClick={() => onCreateRequest(attire, 'missing_link')} disabled={!session}>
                    Request link
                  </button>

                  <button className="secondary-button small-btn" onClick={() => onCreateRequest(attire, 'dead_link')} disabled={!session}>
                    Report dead link
                  </button>

                  {session && attire.owner_id === session.user.id ? (
                    <>
                      <button className="ghost-button small-btn" onClick={() => onEditAttire(wrestler, attire)}>Edit attire</button>
                      <button className="ghost-button small-btn" onClick={() => onDeleteAttire(attire)}>Delete attire</button>
                    </>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="panel soft-panel">
        <div className="panel-header">
          <div>
            <h3>Requests</h3>
            <p className="subtle-copy">Public request feed for missing links, dead links, and other mod needs.</p>
          </div>
        </div>

        {(wrestler.requests || []).length === 0 ? (
          <div className="empty-state small-empty">No requests yet.</div>
        ) : (
          <div className="request-list">
            {wrestler.requests.map((request) => (
              <div className="request-card" key={request.id}>
                <div className="request-card-top">
                  <strong>{request.request_type.replace('_', ' ')}</strong>
                  <span className="pill">{request.status}</span>
                </div>
                <div className="small-text muted-text">{formatDate(request.created_at)}</div>
                <div className="request-note">{request.notes || 'No note added.'}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="json-grid json-grid-two">
        <div className="panel soft-panel json-card">
          <h3>Moveset JSON</h3>
          <pre>{wrestler.moveset_json ? JSON.stringify(wrestler.moveset_json, null, 2) : 'No moveset JSON saved.'}</pre>
        </div>

        <div className="panel soft-panel json-card">
          <h3>Hype / DC profile JSON</h3>
          <pre>{wrestler.profile_json ? JSON.stringify(wrestler.profile_json, null, 2) : 'No profile JSON saved.'}</pre>
        </div>
      </section>
    </div>
  )
}
