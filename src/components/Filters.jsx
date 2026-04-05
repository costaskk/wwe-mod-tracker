export default function Filters({
  query,
  setQuery,
  showMissingOnly,
  setShowMissingOnly,
  sourceFilter,
  setSourceFilter,
  typeFilter,
  setTypeFilter,
  installedOnly,
  setInstalledOnly,
  missingDownloadOnly,
  setMissingDownloadOnly,
  session
}) {
  return (
    <section className="panel soft-panel">
      <div className="panel-header">
        <h2>Search and filters</h2>
      </div>

      <div className="form-grid">
        <label>
          Search wrestler, attire, creator, era, notes
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Sting, 1997, Joker, WhatsTheStatus" />
        </label>

        <div className="form-grid compact-grid compact-grid-3">
          <label>
            Source game
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="WWE 2K25">WWE 2K25</option>
              <option value="WWE 2K24">WWE 2K24</option>
              <option value="WWE 2K23">WWE 2K23</option>
              <option value="WWE 2K22">WWE 2K22</option>
              <option value="WWE 2K19">WWE 2K19</option>
              <option value="WWE 2K18">WWE 2K18</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label>
            Mod type
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="original">Original</option>
              <option value="port">Port</option>
              <option value="remake">Remake</option>
              <option value="update">Update</option>
            </select>
          </label>

          <label className="checkbox-row card-checkbox-row">
            <input type="checkbox" checked={missingDownloadOnly} onChange={(e) => setMissingDownloadOnly(e.target.checked)} />
            Only missing download links
          </label>
        </div>

        <div className="filter-checkbox-grid">
          <label className="checkbox-row card-checkbox-row">
            <input type="checkbox" checked={showMissingOnly} onChange={(e) => setShowMissingOnly(e.target.checked)} />
            Show missing targets, open requests, or incomplete attires only
          </label>

          {session ? (
            <label className="checkbox-row card-checkbox-row">
              <input type="checkbox" checked={installedOnly} onChange={(e) => setInstalledOnly(e.target.checked)} />
              Only attires installed in my game
            </label>
          ) : null}
        </div>
      </div>
    </section>
  )
}
