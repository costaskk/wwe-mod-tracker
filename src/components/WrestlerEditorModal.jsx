
export default function WrestlerEditorModal({
  open,
  form,
  setForm,
  onClose,
  onSave,
  onUploadHeadshot,
  onAutoMatchHeadshot,
  onRemoveHeadshot,
  saving,
  uploading
}) {
  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="panel modal-card large-modal">
        <div className="modal-header">
          <h2>{form.id ? 'Edit wrestler' : 'Add wrestler'}</h2>
          <p className="subtle-copy">Create a wrestler page, add notes and tags, and upload or auto-match a headshot.</p>
        </div>

        <div className="modal-scroll">
          <div className="editor-grid single-editor-grid">
            <section className="panel soft-panel elevated-card">
              <div className="form-grid compact-grid">
                <label>
                  Wrestler name
                  <input value={form.wrestler_name} onChange={(e) => setForm(current => ({ ...current, wrestler_name: e.target.value }))} />
                </label>

                <label>
                  Target attire count
                  <input type="number" min="0" value={form.target_attire_count} onChange={(e) => setForm(current => ({ ...current, target_attire_count: Number(e.target.value) }))} />
                </label>

                <label className="checkbox-row soft-check-row">
                  <input type="checkbox" checked={form.is_missing_target} onChange={(e) => setForm(current => ({ ...current, is_missing_target: e.target.checked }))} />
                  Wanted / still missing
                </label>

                <label>
                  Tags
                  <input value={form.tags_text} onChange={(e) => setForm(current => ({ ...current, tags_text: e.target.value }))} placeholder="Legend, WCW, 1997" />
                </label>

                <label className="span-2">
                  Notes
                  <textarea value={form.notes} onChange={(e) => setForm(current => ({ ...current, notes: e.target.value }))} />
                </label>
              </div>
            </section>

            <section className="panel soft-panel elevated-card">
              <div className="upload-card premium-upload-card">
                <div className="upload-card-header">
                  <h5>Wrestler headshot</h5>
                  <p>Upload a headshot, or try a public auto-match. Press the button again to look for an alternative image.</p>
                </div>

                {form.headshot_url ? (
                  <img className="upload-preview portrait-preview spotlight-image" src={form.headshot_url} alt="Headshot" />
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
            </section>
          </div>
        </div>

        <div className="modal-footer">
          <div className="muted-text">{uploading ? 'Uploading asset…' : ''}</div>
          <button className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={onSave} disabled={saving || uploading}>{saving ? 'Saving…' : 'Save wrestler'}</button>
        </div>
      </div>
    </div>
  )
}
