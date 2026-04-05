export default function Filters({
  query,
  setQuery,
  creatorFilter,
  setCreatorFilter,
  typeFilter,
  setTypeFilter,
  sourceFilter,
  setSourceFilter,
  showMissingOnly,
  setShowMissingOnly,
  creators
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Search & filters</h2>
      </div>

      <div className="form-grid compact-grid">
        <label>
          <span>Search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Wrestler, creator, attire, tag..."
          />
        </label>

        <label>
          <span>Creator</span>
          <select value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value)}>
            <option value="all">All creators</option>
            {creators.map((creator) => (
              <option key={creator} value={creator}>
                {creator}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Type</span>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="original">Original</option>
            <option value="port">Port</option>
            <option value="remake">Remake</option>
            <option value="update">Update</option>
          </select>
        </label>

        <label>
          <span>Source game</span>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">All games</option>
            <option value="WWE 2K25">WWE 2K25</option>
            <option value="WWE 2K24">WWE 2K24</option>
            <option value="WWE 2K23">WWE 2K23</option>
            <option value="WWE 2K22">WWE 2K22</option>
            <option value="WWE 2K19">WWE 2K19</option>
            <option value="WWE 2K18">WWE 2K18</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label className="checkbox-row wide">
          <input
            type="checkbox"
            checked={showMissingOnly}
            onChange={(e) => setShowMissingOnly(e.target.checked)}
          />
          <span>Only show missing or incomplete entries</span>
        </label>
      </div>
    </section>
  )
}
