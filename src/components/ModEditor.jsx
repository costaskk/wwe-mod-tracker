import { emptyAttire } from '../lib/utils'

const SOURCE_GAMES = ['WWE 2K25', 'WWE 2K24', 'WWE 2K23', 'WWE 2K22', 'WWE 2K19', 'WWE 2K18', 'Other']
const MOD_TYPES = ['original', 'port', 'remake', 'update']
const ATTIRE_STATUS = ['complete', 'partial', 'needs_work', 'missing']

export default function ModEditor({ open, form, setForm, onClose, onSave, saving, error }) {
  if (!open) return null

  function updateAttire(id, patch) {
    setForm((current) => ({
      ...current,
      attires: current.attires.map((attire) => (attire.id === id ? { ...attire, ...patch } : attire))
    }))
  }

  function addAttire() {
    setForm((current) => ({
      ...current,
      attires: [...current.attires, emptyAttire()]
    }))
  }

  function removeAttire(id) {
    setForm((current) => ({
      ...current,
      attires: current.attires.filter((attire) => attire.id !== id)
    }))
  }

  function handleJsonFile(event, key) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        [key]: String(reader.result || '')
      }))
    }
    reader.readAsText(file)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card large-modal">
        <div className="panel-header modal-header">
          <h2>{form.id ? 'Edit mod entry' : 'Create mod entry'}</h2>
          <button className="ghost-button" onClick={onClose}>Close</button>
        </div>

        <div className="modal-scroll">
          <div className="editor-grid">
            <section className="panel soft-panel">
              <div className="panel-header">
                <h3>Core details</h3>
              </div>

              <div className="form-grid compact-grid">
                <label className="wide">
                  <span>Wrestler name</span>
                  <input
                    value={form.wrestler_name}
                    onChange={(e) => setForm((current) => ({ ...current, wrestler_name: e.target.value }))}
                  />
                </label>

                <label>
                  <span>Mod creator</span>
                  <input
                    value={form.mod_creator_name}
                    onChange={(e) => setForm((current) => ({ ...current, mod_creator_name: e.target.value }))}
                  />
                </label>

                <label>
                  <span>Game patch version</span>
                  <input
                    value={form.game_version}
                    onChange={(e) => setForm((current) => ({ ...current, game_version: e.target.value }))}
                  />
                </label>

                <label>
                  <span>Source game</span>
                  <select
                    value={form.source_game}
                    onChange={(e) => setForm((current) => ({ ...current, source_game: e.target.value }))}
                  >
                    {SOURCE_GAMES.map((game) => (
                      <option key={game} value={game}>
                        {game}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Mod type</span>
                  <select
                    value={form.mod_type}
                    onChange={(e) => setForm((current) => ({ ...current, mod_type: e.target.value }))}
                  >
                    {MOD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Target attire count</span>
                  <input
                    type="number"
                    min="0"
                    value={form.target_attire_count}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, target_attire_count: Number(e.target.value) }))
                    }
                  />
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={form.is_missing_target}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, is_missing_target: e.target.checked }))
                    }
                  />
                  <span>Mark as missing / wanted target</span>
                </label>

                <label className="wide">
                  <span>Tags</span>
                  <input
                    value={form.tags_text}
                    onChange={(e) => setForm((current) => ({ ...current, tags_text: e.target.value }))}
                    placeholder="Legend, WCW, Entrance Gear"
                  />
                </label>

                <label className="wide">
                  <span>Notes</span>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                    rows="5"
                  />
                </label>
              </div>
            </section>

            <section className="panel soft-panel">
              <div className="panel-header">
                <h3>Links & images</h3>
              </div>
              <div className="form-grid compact-grid">
                <label className="wide">
                  <span>Image URLs, one per line</span>
                  <textarea
                    rows="6"
                    value={form.image_urls_text}
                    onChange={(e) => setForm((current) => ({ ...current, image_urls_text: e.target.value }))}
                  />
                </label>

                <label className="wide">
                  <span>Download links, one per line</span>
                  <textarea
                    rows="6"
                    value={form.download_links_text}
                    onChange={(e) => setForm((current) => ({ ...current, download_links_text: e.target.value }))}
                  />
                </label>
              </div>
            </section>

            <section className="panel soft-panel full-span">
              <div className="panel-header with-actions">
                <h3>Attires</h3>
                <button className="secondary-button" onClick={addAttire}>Add attire</button>
              </div>

              <div className="editor-attire-list">
                {form.attires.map((attire, index) => (
                  <div className="attire-editor-card" key={attire.id}>
                    <div className="panel-header with-actions">
                      <h4>Attire {index + 1}</h4>
                      <button className="danger-button small-btn" onClick={() => removeAttire(attire.id)}>
                        Remove
                      </button>
                    </div>

                    <div className="form-grid compact-grid">
                      <label className="wide">
                        <span>Attire name</span>
                        <input value={attire.name} onChange={(e) => updateAttire(attire.id, { name: e.target.value })} />
                      </label>
                      <label>
                        <span>Slot</span>
                        <input
                          value={attire.slot_name}
                          onChange={(e) => updateAttire(attire.id, { slot_name: e.target.value })}
                        />
                      </label>
                      <label>
                        <span>Era</span>
                        <input value={attire.era} onChange={(e) => updateAttire(attire.id, { era: e.target.value })} />
                      </label>
                      <label>
                        <span>Creator</span>
                        <input
                          value={attire.creator_name}
                          onChange={(e) => updateAttire(attire.id, { creator_name: e.target.value })}
                        />
                      </label>
                      <label>
                        <span>Status</span>
                        <select
                          value={attire.status}
                          onChange={(e) => updateAttire(attire.id, { status: e.target.value })}
                        >
                          {ATTIRE_STATUS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="wide">
                        <span>Image URL</span>
                        <input
                          value={attire.image_url}
                          onChange={(e) => updateAttire(attire.id, { image_url: e.target.value })}
                        />
                      </label>
                      <label className="wide">
                        <span>Download URL</span>
                        <input
                          value={attire.download_url}
                          onChange={(e) => updateAttire(attire.id, { download_url: e.target.value })}
                        />
                      </label>
                      <label className="wide">
                        <span>Notes</span>
                        <textarea
                          rows="3"
                          value={attire.notes}
                          onChange={(e) => updateAttire(attire.id, { notes: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel soft-panel full-span">
              <div className="panel-header">
                <h3>JSON profiles</h3>
              </div>

              <div className="json-editor-grid">
                <label>
                  <span>Moveset / Animations JSON</span>
                  <input type="file" accept="application/json" onChange={(e) => handleJsonFile(e, 'moveset_json_text')} />
                  <textarea
                    rows="10"
                    value={form.moveset_json_text}
                    onChange={(e) => setForm((current) => ({ ...current, moveset_json_text: e.target.value }))}
                  />
                </label>

                <label>
                  <span>Hype Profile JSON</span>
                  <input type="file" accept="application/json" onChange={(e) => handleJsonFile(e, 'hype_profile_json_text')} />
                  <textarea
                    rows="10"
                    value={form.hype_profile_json_text}
                    onChange={(e) => setForm((current) => ({ ...current, hype_profile_json_text: e.target.value }))}
                  />
                </label>

                <label>
                  <span>DC Profile JSON</span>
                  <input type="file" accept="application/json" onChange={(e) => handleJsonFile(e, 'dc_profile_json_text')} />
                  <textarea
                    rows="10"
                    value={form.dc_profile_json_text}
                    onChange={(e) => setForm((current) => ({ ...current, dc_profile_json_text: e.target.value }))}
                  />
                </label>
              </div>
            </section>
          </div>

          {error ? <div className="message error sticky-message">{error}</div> : null}
        </div>

        <div className="modal-footer">
          <button className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save mod entry'}
          </button>
        </div>
      </div>
    </div>
  )
}
