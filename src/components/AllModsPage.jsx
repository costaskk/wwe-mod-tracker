import { useEffect, useMemo, useState } from 'react'
import AllModsFilters from './AllModsFilters'
import AllModsList from './AllModsList'
import {
  OTHER_MOD_SUBTYPES,
  SOURCE_GAMES,
  buildUnifiedModsFeed,
  paginateItems,
  sortUnifiedMods
} from '../lib/utils'

export default function AllModsPage({
  wrestlers = [],
  arenas = [],
  titleBelts = [],
  otherMods = [],
  creators = [],
  onOpenAttire,
  onOpenArena,
  onOpenTitle,
  onOpenOtherMod
}) {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [subtypeFilter, setSubtypeFilter] = useState('all')
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [sourceGameFilter, setSourceGameFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')
  const [page, setPage] = useState(1)

  const perPage = 18

  const allMods = useMemo(() => {
    return buildUnifiedModsFeed({
      wrestlers,
      arenas,
      titleBelts,
      otherMods
    })
  }, [wrestlers, arenas, titleBelts, otherMods])

  const hasActiveFilters = Boolean(
    query.trim() ||
      categoryFilter !== 'all' ||
      subtypeFilter !== 'all' ||
      creatorFilter !== 'all' ||
      sourceGameFilter !== 'all' ||
      sortBy !== 'newest'
  )

  const featuredItems = useMemo(() => {
    return sortUnifiedMods(allMods, 'newest').slice(0, 6)
  }, [allMods])

  const latestItems = useMemo(() => {
    return sortUnifiedMods(allMods, 'updated').slice(0, 6)
  }, [allMods])

  const filteredItems = useMemo(() => {
    const cleanQuery = query.toLowerCase().trim()

    const filtered = allMods.filter((item) => {
      const queryOk = !cleanQuery || item.searchText.includes(cleanQuery)
      const categoryOk = categoryFilter === 'all' || item.modType === categoryFilter
      const subtypeOk =
        categoryFilter !== 'other' ||
        subtypeFilter === 'all' ||
        item.modSubtype === subtypeFilter
      const creatorOk = creatorFilter === 'all' || item.creatorName === creatorFilter
      const sourceGameOk = sourceGameFilter === 'all' || item.sourceGame === sourceGameFilter

      return queryOk && categoryOk && subtypeOk && creatorOk && sourceGameOk
    })

    return sortUnifiedMods(filtered, sortBy)
  }, [
    allMods,
    query,
    categoryFilter,
    subtypeFilter,
    creatorFilter,
    sourceGameFilter,
    sortBy
  ])

  const pagination = useMemo(() => {
    return paginateItems(filteredItems, page, perPage)
  }, [filteredItems, page])

  const visibleFeaturedItems = !hasActiveFilters && page === 1 ? featuredItems : []
  const visibleLatestItems = !hasActiveFilters && page === 1 ? latestItems : []

  useEffect(() => {
    setPage(1)
  }, [query, categoryFilter, subtypeFilter, creatorFilter, sourceGameFilter, sortBy])

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages)
    }
  }, [page, pagination.totalPages])

  return (
    <div className="layout-grid">
      <div className="left-column">
        <AllModsFilters
          query={query}
          setQuery={setQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          subtypeFilter={subtypeFilter}
          setSubtypeFilter={setSubtypeFilter}
          creatorFilter={creatorFilter}
          setCreatorFilter={setCreatorFilter}
          sourceGameFilter={sourceGameFilter}
          setSourceGameFilter={setSourceGameFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          creators={creators}
          sourceGames={SOURCE_GAMES}
          subtypeOptions={OTHER_MOD_SUBTYPES}
        />
      </div>

      <div className="detail-stack">
        <AllModsList
            items={pagination.items}
            summaryItems={filteredItems}
            featuredItems={visibleFeaturedItems}
            latestItems={visibleLatestItems}
            viewMode={viewMode}
            setViewMode={setViewMode}
            pagination={pagination}
            onPageChange={setPage}
            onOpenAttire={onOpenAttire}
            onOpenArena={onOpenArena}
            onOpenTitle={onOpenTitle}
            onOpenOtherMod={onOpenOtherMod}
        />
      </div>
    </div>
  )
}