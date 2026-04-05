import { Plus, Save, X } from 'lucide-react'

function JsonUpload({ label, asset, onChange }) {
  return (
    <div className="upload-card">
      <label>{label}</label>
      <input type="file" accept="application/json" onChange={onChange} />
      <p className="muted small-text">{asset?.filename || 'No file selected'}</p>
    </div>
  )
}

export default function ModEditor({
  isOpen,
  onClose,
  onSave,
  form,
  setForm,
  updateAttire,
  addAttire,
  removeAttire,
  handleJsonUpload,
  editingId,
}) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Entry editor</p>
            <h2>{editingId ? 'Edit mod entry' : 'Create mod entry'}</h2>
            <p className="muted">Add wrestler info, attire slots, images, links, and JSON profile files.</p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="editor-grid">
          <section className="panel editor-panel">
            <div className="section-heading">
              <h3>Core details</h3>
            </div>
            <div className="two-col-grid">
              <label className="field field-span-2">
                <span>Wrestler name</span>
                <input
                  value={form.wrestlerName}
                  onChange={(event) => setForm({ ...form, wrestlerName: event.target.value })}
                />
              </label>

              <label className="field">
                <span>Mod creator</span>
                <input
                  value={form.modCreator}
                  onChange={(event) => setForm({ ...form, modCreator: event.target.value })}
                />
              </label>

              <label className="field">
                <span>Game patch version</span>
                <input
                  value={form.gameVersion}
                  onChange={(event) => setForm({ ...form, gameVersion: event.target.value })}
                />
              </label>

              <label className="field">
                <span>Source game</span>
                <select
                  value={form.sourceGame}
                  onChange={(event) => setForm({ ...form, sourceGame: event.target.value })}
                >
                  <option value="WWE 2K25">WWE 2K25</option>
                  <option value="WWE 2K24">WWE 2K24</option>
                  <option value="WWE 2K23">WWE 2K23</option>
                  <option value="WWE 2K22">WWE 2K22</option>
                  <option value="WWE 2K19">WWE 2K19</option>
                  <option value="WWE 2K18">WWE 2K18</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="field">
                <span>Mod type</span>
                <select value={form.modType} onChange={(event) => setForm({ ...form, modType: event.target.value })}>
                  <option value="Original">Original</option>
                  <option value="Port">Port</option>
                  <option value="Remake">Remake</option>
                  <option value="Update">Update</option>
                </select>
              </label>

              <label className="field field-span-2 checkbox-row boxed">
                <input
                  type="checkbox"
                  checked={form.isMissingTarget}
                  onChange={(event) => setForm({ ...form, isMissingTarget: event.target.checked })}
                />
                <span>Mark as missing / wanted target</span>
              </label>

              <label className="field field-span-2">
                <span>Target attire count</span>
                <input
                  type="number"
                  min="0"
                  value={form.targetAttireCount}
                  onChange={(event) => setForm({ ...form, targetAttireCount: Number(event.target.value) })}
                />
              </label>

              <label className="field field-span-2">
                <span>Tags</span>
                <input
                  value={form.tagsText}
                  onChange={(event) => setForm({ ...form, tagsText: event.target.value })}
                  placeholder="Legend, WCW, Entrance Gear"
                />
              </label>

              <label className="field field-span-2">
                <span>Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  rows="5"
                />
              </label>
            </div>
          </section>

          <section className="panel editor-panel">
            <div className="section-heading">
              <h3>Links & images</h3>
            </div>
            <div className="field-group">
              <label className="field">
                <span>Mod image URLs, one per line</span>
                <textarea
                  value={form.imagesText}
                  onChange={(event) => setForm({ ...form, imagesText: event.target.value })}
                  rows="6"
                />
              </label>
              <label className="field">
                <span>Download links, one per line</span>
                <textarea
                  value={form.downloadLinksText}
                  onChange={(event) => setForm({ ...form, downloadLinksText: event.target.value })}
                  rows="6"
                />
              </label>
            </div>
          </section>

          <section className="panel editor-panel editor-span-2">
            <div className="section-heading split-heading">
              <div>
                <h3>Attires</h3>
                <p className="muted small-text">Add every attire slot you have or want to track.</p>
              </div>
              <button className="button button-secondary" type="button" onClick={addAttire}>
                <Plus size={16} /> Add attire
              </button>
            </div>

            <div className="attire-editor-grid">
              {form.attires.map((attire, index) => (
                <article className="attire-editor-card" key={attire.id}>
                  <div className="split-heading compact-gap">
                    <h4>Attire {index + 1}</h4>
                    <button className="icon-button danger" type="button" onClick={() => removeAttire(attire.id)}>
                      <X size={16} />
                    </button>
                  </div>

                  <div className="two-col-grid">
                    <label className="field field-span-2">
                      <span>Attire name</span>
                      <input value={attire.name} onChange={(e) => updateAttire(attire.id, { name: e.target.value })} />
                    </label>
                    <label className="field">
                      <span>Slot</span>
                      <input value={attire.slot || ''} onChange={(e) => updateAttire(attire.id, { slot: e.target.value })} />
                    </label>
                    <label className="field">
                      <span>Era</span>
                      <input value={attire.era || ''} onChange={(e) => updateAttire(attire.id, { era: e.target.value })} />
                    </label>
                    <label className="field">
                      <span>Creator</span>
                      <input value={attire.creator || ''} onChange={(e) => updateAttire(attire.id, { creator: e.target.value })} />
                    </label>
                    <label className="field">
                      <span>Status</span>
                      <select value={attire.status} onChange={(e) => updateAttire(attire.id, { status: e.target.value })}>
                        <option value="Complete">Complete</option>
                        <option value="Partial">Partial</option>
                        <option value="Needs Work">Needs Work</option>
                        <option value="Missing">Missing</option>
                      </select>
                    </label>
                    <label className="field field-span-2">
                      <span>Image URL</span>
                      <input value={attire.imageUrl || ''} onChange={(e) => updateAttire(attire.id, { imageUrl: e.target.value })} />
                    </label>
                    <label className="field field-span-2">
                      <span>Download link</span>
                      <input value={attire.downloadUrl || ''} onChange={(e) => updateAttire(attire.id, { downloadUrl: e.target.value })} />
                    </label>
                    <label className="field field-span-2">
                      <span>Notes</span>
                      <textarea value={attire.notes || ''} onChange={(e) => updateAttire(attire.id, { notes: e.target.value })} rows="4" />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel editor-panel editor-span-2">
            <div className="section-heading">
              <h3>JSON uploads</h3>
            </div>
            <div className="upload-grid">
              <JsonUpload
                label="Moveset / Animations JSON"
                asset={form.movesetJson}
                onChange={(event) => handleJsonUpload(event, 'movesetJson')}
              />
              <JsonUpload
                label="Hype Profile JSON"
                asset={form.hypeProfileJson}
                onChange={(event) => handleJsonUpload(event, 'hypeProfileJson')}
              />
              <JsonUpload
                label="DC Profile JSON"
                asset={form.dcProfileJson}
                onChange={(event) => handleJsonUpload(event, 'dcProfileJson')}
              />
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button button-primary" onClick={onSave}>
            <Save size={18} /> Save entry
          </button>
        </div>
      </div>
    </div>
  )
}
