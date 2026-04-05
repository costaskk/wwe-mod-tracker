
export default function CollectionModal({ open, form, setForm, onClose, onSave, onUploadCover, onRemoveCover, saving, uploading }) {
  if (!open) return null

  return (
    <div className="modal-backdrop modal-backdrop-front">
      <div className="panel modal-card large-modal">
        <div className="modal-header">
          <h2>{form.id ? 'Edit collection' : 'Create collection'}</h2>
          <p className="subtle-copy">Build a personal mod pack, add a cover, and choose whether it is private or shareable.</p>
        </div>

        <div className="modal-scroll">
          <div className="editor-grid single-editor-grid">
            <section className="panel soft-panel elevated-card">
              <div className="form-grid compact-grid">
                <label>
                  Collection name
                  <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
                </label>

                <label>
                  Share slug
                  <input value={form.slug} onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value }))} placeholder="my-aew-pack" />
                </label>

                <label className="span-2">
                  Description
                  <textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
                </label>

                <label>
                  Visibility
                  <select value={form.visibility} onChange={(e) => setForm((current) => ({ ...current, visibility: e.target.value }))}>
                    <option value="public">Public / shareable</option>
                    <option value="private">Private / profile only</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="panel soft-panel elevated-card">
              <div className="upload-card premium-upload-card">
                <div className="upload-card-header">
                  <h5>Collection cover</h5>
                  <p>Optional banner image for your profile and public share page.</p>
                </div>

                {form.cover_url ? <img className="upload-preview cover-preview" src={form.cover_url} alt={form.name || 'Collection cover'} /> : <div className="upload-placeholder">No cover uploaded</div>}

                <div className="upload-actions wrap-actions">
                  <label className="secondary-button inline-file file-button">
                    Upload cover
                    <input type="file" accept="image/*" onChange={(e) => onUploadCover(e.target.files?.[0])} />
                  </label>
                  {(form.cover_path || form.cover_url) ? <button className="ghost-button" onClick={onRemoveCover}>Remove</button> : null}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="modal-footer">
          <div className="muted-text">{uploading ? 'Uploading cover…' : ''}</div>
          <button className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={onSave} disabled={saving || uploading}>{saving ? 'Saving…' : 'Save collection'}</button>
        </div>
      </div>
    </div>
  )
}
