import { formatDate, prettifyJson } from '../lib/utils'

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
    return <section className="panel empty-state">Select a mod entry to see its details.</section>
  }

  return (
    <section className="detail-stack">
      <article className="panel detail-hero">
        <div className="detail-heading-row">
          <div>
            <div className="eyebrow">MOD ENTRY</div>
            <h2>{mod.wrestler_name}</h2>
            <p className="muted">Created by {mod.mod_creator_name || 'Unknown creator'}</p>
          </div>
          <div className="tag-cluster">
            <span className="pill">{mod.mod_type}</span>
            <span className="pill">{mod.source_game}</span>
            <span className="pill">Patch {mod.game_version}</span>
          </div>
        </div>

        <div className="mini-stats">
          <div>
            <span>Attires</span>
            <strong>{mod.attires?.length || 0}</strong>
          </div>
          <div>
            <span>Target</span>
            <strong>{mod.target_attire_count || 0}</strong>
          </div>
          <div>
            <span>Gap</span>
            <strong>{Math.max(0, (mod.target_attire_count || 0) - (mod.attires?.length || 0))}</strong>
          </div>
          <div>
            <span>Updated</span>
            <strong>{formatDate(mod.updated_at)}</strong>
          </div>
        </div>

        {mod.tags?.length ? (
          <div className="tag-cluster tags-row">
            {mod.tags.map((tag) => (
              <span key={tag} className="pill dark">#{tag}</span>
            ))}
          </div>
        ) : null}

        {mod.notes ? <div className="note-box">{mod.notes}</div> : null}
      </article>

      <article className="panel">
        <div className="panel-header">
          <h2>Download links</h2>
        </div>
        {mod.download_links?.length ? (
          <div className="links-list">
            {mod.download_links.map((link) => (
              <a key={link} href={link} target="_blank" rel="noreferrer" className="link-card">
                {link}
              </a>
            ))}
          </div>
        ) : (
          <div className="empty-state small-empty">No download links saved.</div>
        )}
      </article>

      <article className="panel">
        <div className="panel-header">
          <h2>Gallery</h2>
        </div>
        {mod.image_urls?.length ? (
          <div className="gallery-grid">
            {mod.image_urls.map((url) => (
              <div key={url} className="gallery-card">
                <img src={url} alt={mod.wrestler_name} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state small-empty">No images saved.</div>
        )}
      </article>

      <article className="panel">
        <div className="panel-header">
          <h2>Attires</h2>
        </div>
        {mod.attires?.length ? (
          <div className="attire-grid">
            {mod.attires.map((attire) => (
              <div key={attire.id} className="attire-card">
                <div className="attire-card-top">
                  <div>
                    <h3>{attire.name}</h3>
                    <p className="muted">
                      {attire.era || 'Unknown era'}
                      {attire.slot_name ? ` • ${attire.slot_name}` : ''}
                    </p>
                  </div>
                  <span className={`status-pill status-${attire.status}`}>{attire.status}</span>
                </div>
                {attire.image_url ? <img src={attire.image_url} alt={attire.name} /> : null}
                <div className="attire-meta">
                  <div><strong>Creator:</strong> {attire.creator_name || '—'}</div>
                  <div><strong>Notes:</strong> {attire.notes || '—'}</div>
                  <div>
                    <strong>Download:</strong>{' '}
                    {attire.download_url ? (
                      <a href={attire.download_url} target="_blank" rel="noreferrer">
                        Open link
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state small-empty">No attires saved.</div>
        )}
      </article>

      <article className="json-grid">
        <JsonBlock title="Moveset / Animations" value={mod.moveset_json} />
        <JsonBlock title="Hype Profile" value={mod.hype_profile_json} />
        <JsonBlock title="DC Profile" value={mod.dc_profile_json} />
      </article>
    </section>
  )
}
