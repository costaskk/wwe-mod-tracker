import { ATTIRE_STATUSES, MOD_TYPES, SOURCE_GAMES } from '../lib/utils'

export default function AttireEditorModal({
  open, form, setForm, onClose, onSave, onUpload, onRemoveAsset, saving, uploading, error
}) {
  if (!open) return null

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  return (
    <div className="modal-backdrop">
      <div className="panel modal-card large-modal">
        <div className="modal-header">
          <h2>{form.id ? 'Edit attire mod' : 'Add attire mod'}</h2>
          <p className="subtle-copy">Each attire stores its own creator, download link, preview image, DDS render, game source, and status.</p>
        </div>

        <div className="modal-scroll">
          <div className="editor-grid">
            <section className="panel soft-panel">
              <div className="form-grid">
                <label>
                  Attire name
                  <input value={form.name} onChange={(e) => updateField('name', e.target.value)} />
                </label>

                <div className="form-grid compact-grid">
                  <label>
                    Slot
                    <input value={form.slot_name} onChange={(e) => updateField('slot_name', e.target.value)} placeholder="A, B, 1, 2" />
                  </label>

                  <label>
                    Era
                    <input value={form.era} onChange={(e) => updateField('era', e.target.value)} placeholder="1997 WCW, 2001 WWF" />
                  </label>
                </div>

                <div className="form-grid compact-grid">
                  <label>
                    Creator
                    <input value={form.creator_name} onChange={(e) => updateField('creator_name', e.target.value)} />
                  </label>

                  <label>
                    Status
                    <select value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                      {ATTIRE_STATUSES.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                </div>

                <div className="form-grid compact-grid">
                  <label>
                    Source game
                    <select value={form.source_game} onChange={(e) => updateField('source_game', e.target.value)}>
                      {SOURCE_GAMES.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>

                  <label>
                    Mod type
                    <select value={form.mod_type} onChange={(e) => updateField('mod_type', e.target.value)}>
                      {MOD_TYPES.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                </div>

                <label>
                  Game patch version
                  <input value={form.game_version} onChange={(e) => updateField('game_version', e.target.value)} />
                </label>

                <label>
                  Download link
                  <input value={form.download_url} onChange={(e) => updateField('download_url', e.target.value)} placeholder="https://..." />
                </label>

                <label>
                  Notes
                  <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
                </label>
              </div>
            </section>

            <section className="panel soft-panel">
              <div className="upload-grid">
                <div className="upload-card">
                  <div className="upload-card-header">
                    <h5>Preview image</h5>
                    <p>Normal image shown in the browser.</p>
                  </div>

                  {form.preview_image_url ? (
                    <img className="upload-preview" src={form.preview_image_url} alt="Preview" />
                  ) : (
                    <div className="upload-placeholder">No preview uploaded</div>
                  )}

                  <div className="upload-actions">
                    <label className="secondary-button inline-file file-button">
                      Upload image
                      <input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0], 'preview')} />
                    </label>
                    {form.preview_image_path ? <button className="ghost-button" onClick={() => onRemoveAsset('preview')}>Remove</button> : null}
                  </div>
                </div>

                <div className="upload-card">
                  <div className="upload-card-header">
                    <h5>DDS render</h5>
                    <p>Character selection render file.</p>
                  </div>

                  {form.render_dds_url ? (
                    <div className="render-tile">
                      <div className="render-badge">DDS</div>
                      <div className="render-name">{form.render_dds_name || 'Render file'}</div>
                      <a className="secondary-button inline-btn" href={form.render_dds_url} target="_blank" rel="noreferrer">Download render</a>
                    </div>
                  ) : (
                    <div className="upload-placeholder">No DDS render uploaded</div>
                  )}

                  <div className="upload-actions">
                    <label className="secondary-button inline-file file-button">
                      Upload DDS
                      <input type="file" accept=".dds" onChange={(e) => onUpload(e.target.files?.[0], 'render')} />
                    </label>
                    {form.render_dds_path ? <button className="ghost-button" onClick={() => onRemoveAsset('render')}>Remove</button> : null}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {error ? <div className="message error modal-message">{error}</div> : null}

        <div className="modal-footer">
          <div className="muted-text">{uploading ? 'Uploading asset…' : ''}</div>
          <button className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={onSave} disabled={saving || uploading}>{saving ? 'Saving…' : 'Save attire'}</button>
        </div>
      </div>
    </div>
  )
}
