export default function WrestlerEditorModal({ open, form, setForm, onClose, onSave, saving, error }) {
  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="panel modal-card large-modal">
        <div className="modal-header">
          <h2>{form.id ? 'Edit wrestler' : 'Add wrestler'}</h2>
          <p className="subtle-copy">This creates the public wrestler page. Attire mods are added separately.</p>
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
                <label>
                  Moveset JSON
                  <textarea value={form.moveset_json_text} onChange={(e) => setForm(current => ({ ...current, moveset_json_text: e.target.value }))} />
                </label>

                <label>
                  Hype / DC profile JSON
                  <textarea value={form.profile_json_text} onChange={(e) => setForm(current => ({ ...current, profile_json_text: e.target.value }))} />
                </label>
              </div>
            </section>
          </div>
        </div>

        {error ? <div className="message error modal-message">{error}</div> : null}

        <div className="modal-footer">
          <button className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save wrestler'}</button>
        </div>
      </div>
    </div>
  )
}
