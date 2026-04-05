
export default function Filters({
  query,
  setQuery,
  showMissingOnly,
  setShowMissingOnly,
  creatorFilter,
  setCreatorFilter,
  creators,
  installFilter,
  setInstallFilter,
  missingDownloadOnly,
  setMissingDownloadOnly,
  session,
  newCreatorName,
  setNewCreatorName,
  onAddCreator,
  addingCreator
}) {
  return (
    <section className="panel soft-panel filters-panel">
      <div className="panel-header">
        <div>
          <h2>Search and filters</h2>
          <p className="subtle-copy">Find mods by wrestler, attire, creator, install state, or missing download links.</p>
        </div>
      </div>

      <div className="form-grid">
        <label>
          Search wrestler, attire, creator, era, notes
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Sting, Adam Cole, Joker, WhatsTheStatus"
          />
        </label>

        <div className="filter-row-grid">
          <label>
            Creator
            <select value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value)}>
              <option value="all">All creators</option>
              {creators.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>
          </label>

          <label>
            Installed state
            <select value={installFilter} onChange={(e) => setInstallFilter(e.target.value)} disabled={!session}>
              <option value="all">All mods</option>
              <option value="installed">Installed in my game</option>
              <option value="not_installed">Not installed in my game</option>
            </select>
          </label>
        </div>

        <div className="filter-checkbox-grid">
          <label className="checkbox-row card-checkbox-row">
            <input type="checkbox" checked={missingDownloadOnly} onChange={(e) => setMissingDownloadOnly(e.target.checked)} />
            Only missing download links
          </label>

          <label className="checkbox-row card-checkbox-row">
            <input type="checkbox" checked={showMissingOnly} onChange={(e) => setShowMissingOnly(e.target.checked)} />
            Only missing targets, open requests, or incomplete attires
          </label>
        </div>

        {session ? (
          <div className="creator-quick-add elevated-card">
            <div>
              <strong>Add a mod creator</strong>
              <div className="muted-text">Add a creator once so everyone can select them from the dropdown.</div>
            </div>
            <div className="inline-stack creator-inline-stack">
              <input value={newCreatorName} onChange={(e) => setNewCreatorName(e.target.value)} placeholder="Creator name" />
              <button type="button" className="secondary-button small-btn" onClick={onAddCreator} disabled={addingCreator || !newCreatorName.trim()}>
                {addingCreator ? 'Adding…' : 'Add creator'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
