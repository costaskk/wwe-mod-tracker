import { ATTIRE_STATUSES, MOD_TYPES, SOURCE_GAMES } from '../lib/utils'

export default function AttireEditorModal({
  open,
  form,
  setForm,
  onClose,
  onSave,
  onUpload,
  onRemoveAsset,
  creatorOptions,
  newCreatorName,
  setNewCreatorName,
  onAddCreator,
  saving,
  uploading,
  error
}) {
  if (!open) return null

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  return (
    <div className="modal-backdrop">
      <div className="panel modal-card large-modal">
        <div className="modal-header">
          <h2>{form.persisted ? 'Edit attire mod' : 'Add attire mod'}</h2>
          <p className="subtle-copy">Each attire stores its own creator, links, multiple screenshots, and DDS render.</p>
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
                    Era / appearance date hint
                    <input value={form.era} onChange={(e) => updateField('era', e.target.value)} placeholder="1997 WCW, March 2001, Ruthless Aggression" />
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
                    Creator
                    <select value={form.creator_name} onChange={(e) => updateField('creator_name', e.target.value)}>
                      <option value="">Select a creator</option>
                      {creatorOptions.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                    </select>
                  </label>

                  <label>
                    Add creator
                    <div className="inline-stack">
                      <input value={newCreatorName} onChange={(e) => setNewCreatorName(e.target.value)} placeholder="New creator name" />
                      <button type="button" className="secondary-button small-btn" onClick={onAddCreator}>Add</button>
                    </div>
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
              <div className="upload-grid single-column-upload-grid">
                <div className="upload-card">
                  <div className="upload-card-header">
                    <h5>Attire screenshots</h5>
                    <p>Upload multiple images for this attire.</p>
                  </div>

                  {form.images.length ? (
                    <div className="gallery-grid modal-gallery-grid">
                      {form.images.map((image) => (
                        <div className="gallery-tile" key={image.path || image.id}>
                          <img className="gallery-img" src={image.url} alt={image.name || 'Attire screenshot'} />
                          <button className="ghost-button small-btn gallery-remove" type="button" onClick={() => onRemoveAsset('image', image.path)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="upload-placeholder">No attire images uploaded</div>
                  )}

                  <div className="upload-actions">
                    <label className="secondary-button inline-file file-button">
                      Upload image(s)
                      <input type="file" accept="image/*" multiple onChange={(e) => onUpload(Array.from(e.target.files || []), 'image')} />
                    </label>
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
                    {form.render_dds_path ? <button className="ghost-button" type="button" onClick={() => onRemoveAsset('render', form.render_dds_path)}>Remove</button> : null}
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
