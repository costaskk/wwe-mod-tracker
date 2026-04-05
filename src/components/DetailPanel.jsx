import { FileJson, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'

function formatDate(iso) {
  return new Date(iso).toLocaleString()
}

function JsonCard({ title, asset }) {
  return (
    <article className="json-card">
      <h4>{title}</h4>
      <p className="muted small-text">{asset?.filename || 'No file uploaded'}</p>
      <pre>{asset?.content || 'No JSON stored for this section.'}</pre>
    </article>
  )
}

export default function DetailPanel({ selectedMod }) {
  if (!selectedMod) {
    return <section className="panel empty-detail">Select a wrestler mod or create a new entry.</section>
  }

  return (
    <div className="detail-stack">
      <section className="panel detail-hero">
        <div className="detail-main-grid">
          <div>
            <div className="detail-header-row">
              <div>
                <h2>{selectedMod.wrestlerName}</h2>
                <p className="muted intro-copy">
                  Created by <strong>{selectedMod.modCreator || 'Unknown'}</strong>
                </p>
              </div>
              <div className="badge-stack right">
                <span className="badge badge-bright">{selectedMod.modType}</span>
                <span className="badge">{selectedMod.sourceGame}</span>
                <span className="badge">Patch {selectedMod.gameVersion}</span>
              </div>
            </div>

            <div className="detail-stat-grid">
              <article className="mini-stat">
                <span>Attires</span>
                <strong>{selectedMod.attires.length}</strong>
              </article>
              <article className="mini-stat">
                <span>Target</span>
                <strong>{selectedMod.targetAttireCount}</strong>
              </article>
              <article className="mini-stat">
                <span>Gap</span>
                <strong>{Math.max(0, selectedMod.targetAttireCount - selectedMod.attires.length)}</strong>
              </article>
              <article className="mini-stat">
                <span>Updated</span>
                <strong className="small-strong">{formatDate(selectedMod.updatedAt)}</strong>
              </article>
            </div>

            {selectedMod.tags.length > 0 && (
              <div className="badge-stack top-gap">
                {selectedMod.tags.map((tag) => (
                  <span className="badge" key={tag}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {selectedMod.notes && <div className="notes-box">{selectedMod.notes}</div>}
          </div>

          <aside className="quick-panel">
            <div className="quick-block">
              <div className="quick-title">
                <LinkIcon size={16} /> Download links
              </div>
              {selectedMod.downloadLinks.length ? (
                <div className="link-stack">
                  {selectedMod.downloadLinks.map((link) => (
                    <a href={link} target="_blank" rel="noreferrer" key={link}>
                      {link}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="empty-box small">No links added</div>
              )}
            </div>

            <div className="quick-block">
              <div className="quick-title">
                <FileJson size={16} /> JSON assets
              </div>
              <div className="json-summary-grid">
                {[
                  ['Moveset', selectedMod.movesetJson],
                  ['Hype Profile', selectedMod.hypeProfileJson],
                  ['DC Profile', selectedMod.dcProfileJson],
                ].map(([label, asset]) => (
                  <article className="json-summary-card" key={label}>
                    <strong>{label}</strong>
                    <span>{asset?.filename || 'Not uploaded'}</span>
                  </article>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Attire breakdown</h2>
            <p className="muted">See which attire slots exist and which ones still need work.</p>
          </div>
        </div>

        <div className="attire-grid">
          {selectedMod.attires.length ? (
            selectedMod.attires.map((attire) => (
              <article className="attire-card" key={attire.id}>
                <div className="attire-top-row">
                  <div>
                    <h3>{attire.name}</h3>
                    <p className="muted small-text">
                      {attire.era || 'Unknown era'} {attire.slot ? `• Slot ${attire.slot}` : ''}
                    </p>
                  </div>
                  <span className={`status-pill status-${attire.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {attire.status}
                  </span>
                </div>

                {attire.imageUrl ? (
                  <img src={attire.imageUrl} alt={attire.name} className="attire-image" />
                ) : (
                  <div className="empty-image">
                    <ImageIcon size={18} /> No attire image
                  </div>
                )}

                <div className="attire-meta">
                  <p>
                    <span>Creator:</span> {attire.creator || '—'}
                  </p>
                  <p>
                    <span>Notes:</span> {attire.notes || '—'}
                  </p>
                  <p>
                    <span>Download:</span>{' '}
                    {attire.downloadUrl ? (
                      <a href={attire.downloadUrl} target="_blank" rel="noreferrer">
                        {attire.downloadUrl}
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-box">No attires saved.</div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Gallery</h2>
            <p className="muted">Preview main mod images you saved for this entry.</p>
          </div>
        </div>

        {selectedMod.images.length ? (
          <div className="gallery-grid">
            {selectedMod.images.map((image, index) => (
              <div className="gallery-card" key={`${image}-${index}`}>
                <img src={image} alt={`${selectedMod.wrestlerName} ${index + 1}`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-box">No gallery images added.</div>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>JSON assets</h2>
            <p className="muted">Store movesets, animations, hype profiles, and DC profiles directly inside each entry.</p>
          </div>
        </div>

        <div className="json-grid">
          <JsonCard title="Moveset / Animations" asset={selectedMod.movesetJson} />
          <JsonCard title="Hype Profile" asset={selectedMod.hypeProfileJson} />
          <JsonCard title="DC Profile" asset={selectedMod.dcProfileJson} />
        </div>
      </section>
    </div>
  )
}
