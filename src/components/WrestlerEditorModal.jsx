export default function WrestlerEditorModal({
  open,
  form,
  setForm,
  onClose,
  onSave,
  onUploadHeadshot,
  onAutoMatchHeadshot,
  onRemoveHeadshot,
  onUploadJson,
  saving,
  uploading,
  error
}) {
  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="panel modal-card large-modal">
        <div className="modal-header">
          <h2>{form.id ? 'Edit wrestler' : 'Add wrestler'}</h2>
          <p className="subtle-copy">Create the public wrestler page, upload a headshot, and attach moveset and profile JSON files.</p>
        </div>

        <div className="modal-scroll">
          <div className="editor-grid">
            <section className="panel soft-panel">
              <div className="form-grid">
                <label>
                  Wrestler name
                  <input value={form.wrestler_name} onChange={(e) => setForm(current => ({ ...current, wrestler_name: e.target.value }))} />
                </label>

                <div className="form-grid compact-grid">
                  <label>
                    Target attire count
                    <input type="number" min="0" value={form.target_attire_count} onChange={(e) => setForm(current => ({ ...current, target_attire_count: Number(e.target.value) }))} />
                  </label>

                  <label className="checkbox-row">
                    <input type="checkbox" checked={form.is_missing_target} onChange={(e) => setForm(current => ({ ...current, is_missing_target: e.target.checked }))} />
                    Wanted / still missing
                  </label>
                </div>

                <label>
                  Tags
                  <input value={form.tags_text} onChange={(e) => setForm(current => ({ ...current, tags_text: e.target.value }))} placeholder="Legend, WCW, 1997" />
                </label>

                <label>
                  Notes
                  <textarea value={form.notes} onChange={(e) => setForm(current => ({ ...current, notes: e.target.value }))} />
                </label>
              </div>
            </section>

            <section className="panel soft-panel">
              <div className="form-grid">
                <div className="upload-card">
                  <div className="upload-card-header">
                    <h5>Wrestler headshot</h5>
                    <p>Upload a headshot, or try an automatic public match based on the wrestler name.</p>
                  </div>

                  {form.headshot_url ? (
                    <img className="upload-preview portrait-preview" src={form.headshot_url} alt="Headshot" />
                  ) : (
                    <div className="upload-placeholder">No wrestler image saved</div>
                  )}

                  <div className="upload-actions wrap-actions">
                    <label className="secondary-button inline-file file-button">
                      Upload headshot
                      <input type="file" accept="image/*" onChange={(e) => onUploadHeadshot(e.target.files?.[0])} />
                    </label>
                    <button className="ghost-button" onClick={onAutoMatchHeadshot} disabled={!form.wrestler_name.trim() || uploading}>Try auto-match</button>
                    {(form.headshot_path || form.headshot_external_url) ? <button className="ghost-button" onClick={onRemoveHeadshot}>Remove</button> : null}
                  </div>
                </div>

                <label>
                  Moveset / animations JSON
                  <textarea value={form.moveset_json_text} onChange={(e) => setForm(current => ({ ...current, moveset_json_text: e.target.value }))} />
                  <span className="field-actions">
                    <label className="secondary-button inline-file file-button small-btn">
                      Upload JSON
                      <input type="file" accept="application/json,.json" onChange={(e) => onUploadJson(e.target.files?.[0], 'moveset')} />
                    </label>
                  </span>
                </label>

                <label>
                  Hype / DC profile JSON
                  <textarea value={form.profile_json_text} onChange={(e) => setForm(current => ({ ...current, profile_json_text: e.target.value }))} />
                  <span className="field-actions">
                    <label className="secondary-button inline-file file-button small-btn">
                      Upload JSON
                      <input type="file" accept="application/json,.json" onChange={(e) => onUploadJson(e.target.files?.[0], 'profile')} />
                    </label>
                  </span>
                </label>
              </div>
            </section>
          </div>
        </div>

        {error ? <div className="message error modal-message">{error}</div> : null}

        <div className="modal-footer">
          <div className="muted-text">{uploading ? 'Uploading asset…' : ''}</div>
          <button className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={onSave} disabled={saving || uploading}>{saving ? 'Saving…' : 'Save wrestler'}</button>
        </div>
      </div>
    </div>
  )
}
