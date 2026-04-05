import { formatDate, prettifyJson, statusLabel } from '../lib/utils'

function JsonBlock({ title, value }) {
  return (
    <div className="json-card">
      <h3>{title}</h3>
      <pre>{value ? prettifyJson(value) : 'No JSON saved.'}</pre>
    </div>
  )
}

export default function DetailPanel({ mod }) {
  if (!mod) {
    return <section className="panel empty-state">Select a wrestler entry to see the full details.</section>
  }

  return (
    <section className="detail-stack">
      <article className="panel detail-hero">
        <div className="detail-heading-row">
          <div>
            <div className="eyebrow">WRESTLER ENTRY</div>
            <h2>{mod.wrestler_name}</h2>
            <p className="muted">{mod.source_game} • patch {mod.game_version}</p>
          </div>
          <div className="tag-cluster">
            <span className="pill">{mod.mod_type}</span>
            {mod.is_missing_target ? <span className="pill danger-pill">Missing target</span> : null}
          </div>
        </div>

        <div className="mini-stats">
          <div><span>Attires</span><strong>{mod.attires?.length || 0}</strong></div>
          <div><span>Target</span><strong>{mod.target_attire_count || 0}</strong></div>
          <div><span>Gap</span><strong>{Math.max(0, (mod.target_attire_count || 0) - (mod.attires?.length || 0))}</strong></div>
          <div><span>Updated</span><strong>{formatDate(mod.updated_at)}</strong></div>
        </div>

        {mod.tags?.length ? (
          <div className="tag-cluster tags-row">
            {mod.tags.map((tag) => <span key={tag} className="pill dark">#{tag}</span>)}
          </div>
        ) : null}

        {mod.notes ? <div className="note-box">{mod.notes}</div> : null}
      </article>

      <article className="panel">
        <div className="panel-header"><h2>Attires</h2></div>
        {mod.attires?.length ? (
          <div className="attire-grid">
            {mod.attires.map((attire) => (
              <div key={attire.id} className="attire-card improved-attire-card">
                <div className="attire-card-top">
                  <div>
                    <h3>{attire.name}</h3>
                    <p className="muted">{attire.era || 'Unknown era'}{attire.slot_name ? ` • ${attire.slot_name}` : ''}</p>
                  </div>
                  <span className={`status-pill status-${attire.status}`}>{statusLabel(attire.status)}</span>
                </div>

                <div className="attire-visuals">
                  <div className="visual-block">
                    <div className="visual-label">Preview image</div>
                    {attire.preview_image_url ? (
                      <img src={attire.preview_image_url} alt={attire.name} />
                    ) : (
                      <div className="visual-placeholder">No preview uploaded</div>
                    )}
                  </div>

                  <div className="visual-block render-block">
                    <div className="visual-label">DDS render</div>
                    <div className="render-tile">
                      <div className="render-badge">DDS</div>
                      <div className="render-name">{attire.render_dds_name || 'No render uploaded'}</div>
                      {attire.render_dds_url ? (
                        <a href={attire.render_dds_url} target="_blank" rel="noreferrer" className="secondary-button inline-btn">
                          Download render
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="attire-meta split-meta">
                  <div><strong>Creator:</strong> {attire.creator_name || '—'}</div>
                  <div>
                    <strong>Download:</strong>{' '}
                    {attire.download_url ? <a href={attire.download_url} target="_blank" rel="noreferrer">Open link</a> : '—'}
                  </div>
                  <div className="wide-meta"><strong>Notes:</strong> {attire.notes || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state small-empty">No attires saved.</div>
        )}
      </article>

      <article className="json-grid json-grid-two">
        <JsonBlock title="Moveset / Animations" value={mod.moveset_json} />
        <JsonBlock title="Hype / DC Profile" value={mod.profile_json} />
      </article>
    </section>
  )
}
