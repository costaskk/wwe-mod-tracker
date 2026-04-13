import { getModTypeLabel, getOtherModSubtypeLabel } from '../lib/utils'

export default function AllModsFilters({
  query,
  setQuery,
  categoryFilter,
  setCategoryFilter,
  subtypeFilter,
  setSubtypeFilter,
  creatorFilter,
  setCreatorFilter,
  sourceGameFilter,
  setSourceGameFilter,
  installFilter,
  setInstallFilter,
  linkStatusFilter,
  setLinkStatusFilter,
  sortBy,
  setSortBy,
  creators = [],
  sourceGames = [],
  subtypeOptions = []
}) {
  const creatorOptions = [...(creators || [])]
    .filter((item) => item && item.name)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))

  const sortedSubtypeOptions = [...(subtypeOptions || [])]
    .filter(Boolean)
    .sort((a, b) =>
      getOtherModSubtypeLabel(a).localeCompare(getOtherModSubtypeLabel(b))
    )

  const subtypeDisabled = categoryFilter !== 'other'

  function resetFilters() {
    setQuery('')
    setCategoryFilter('all')
    setSubtypeFilter('all')
    setCreatorFilter('all')
    setSourceGameFilter('all')
    setLinkStatusFilter('all')
    setInstallFilter('all')
    setSortBy('newest')
  }

  return (
    <section className="panel soft-panel filters-panel">
      <div className="panel-header with-actions">
        <div>
          <h2>Search and filters</h2>
          <p className="subtle-copy">
            Browse every uploaded mod in one place, then filter by category,
            creator, source game, subtype, or upload date.
          </p>
        </div>

        <div className="wrap-actions">
          <button
            type="button"
            className="ghost-button small-btn"
            onClick={resetFilters}
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="form-grid">
        <label>
          Search mods, wrestlers, creators, notes, subtypes
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Sting, AEW Dynasty, Cruiserweight, crowd, title belt"
          />
        </label>

        <div className="filter-row-grid filter-row-grid-two">
          <label>
            Category
            <select
              value={categoryFilter}
              onChange={(event) => {
                const nextValue = event.target.value
                setCategoryFilter(nextValue)

                if (nextValue !== 'other') {
                  setSubtypeFilter('all')
                }
              }}
            >
              <option value="all">All categories</option>
              <option value="attire">{getModTypeLabel('attire')}</option>
              <option value="arena">{getModTypeLabel('arena')}</option>
              <option value="title">{getModTypeLabel('title')}</option>
              <option value="other">{getModTypeLabel('other')}</option>
            </select>
          </label>

          <label>
            Sort by
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="newest">Newest uploaded</option>
              <option value="oldest">Oldest uploaded</option>
              <option value="updated">Recently updated</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
            </select>
          </label>
        </div>

        <div className="filter-row-grid filter-row-grid-three">
            <label>
                Creator
                <select
                value={creatorFilter}
                onChange={(event) => setCreatorFilter(event.target.value)}
                >
                <option value="all">All creators</option>
                {(creators || []).map((item) => (
                    <option key={item.id} value={item.name}>
                    {item.name}
                    </option>
                ))}
                </select>
            </label>

            <label>
                Source game
                <select
                value={sourceGameFilter}
                onChange={(event) => setSourceGameFilter(event.target.value)}
                >
                <option value="all">All games</option>
                {(sourceGames || []).map((game) => (
                    <option key={game} value={game}>
                    {game === 'WWE 2K26' ? 'WWE 2K26 • NEW' : game}
                    </option>
                ))}
                </select>
            </label>

            <label>
                Install status
                <select
                value={installFilter}
                onChange={(event) => setInstallFilter(event.target.value)}
                >
                <option value="all">All mods</option>
                <option value="installed">Installed only</option>
                <option value="not_installed">Not installed only</option>
                </select>
            </label>
            <label>
              Link status
              <select
                value={linkStatusFilter}
                onChange={(event) => setLinkStatusFilter(event.target.value)}
              >
                <option value="all">All links</option>
                <option value="active">Active only</option>
                <option value="missing">Missing only</option>
                <option value="dead">Dead only</option>
                <option value="issues">Missing or dead</option>
              </select>
            </label>
            <label>
                Other Mod subtype
                <select
                value={subtypeFilter}
                onChange={(event) => setSubtypeFilter(event.target.value)}
                disabled={categoryFilter !== 'other'}
                >
                <option value="all">All subtypes</option>
                {(subtypeOptions || []).map((subtype) => (
                    <option key={subtype} value={subtype}>
                    {getOtherModSubtypeLabel(subtype)}
                    </option>
                ))}
                </select>
            </label>
          </div>
      </div>
    </section>
  )
}