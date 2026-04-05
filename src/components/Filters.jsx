import { Search } from 'lucide-react'

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
  creators,
}) {
  return (
    <section className="panel filters-panel">
      <div className="section-heading">
        <h2>Search & filters</h2>
      </div>

      <div className="search-field">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search wrestler, creator, attire, notes..."
        />
      </div>

      <div className="two-col-grid">
        <label className="field">
          <span>Creator</span>
          <select value={creatorFilter} onChange={(event) => setCreatorFilter(event.target.value)}>
            <option value="all">All creators</option>
            {creators.map((creator) => (
              <option key={creator} value={creator}>
                {creator}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Type</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">All types</option>
            <option value="Original">Original</option>
            <option value="Port">Port</option>
            <option value="Remake">Remake</option>
            <option value="Update">Update</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span>Source game</span>
        <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
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

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={showMissingOnly}
          onChange={(event) => setShowMissingOnly(event.target.checked)}
        />
        <span>Show only missing or incomplete entries</span>
      </label>
    </section>
  )
}
