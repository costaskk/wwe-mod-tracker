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
  session,
  canContribute,
  supabase,
  openNotice,
  installedIds,
  setInstalledIds,
  installedArenaIds,
  setInstalledArenaIds,
  installedTitleIds,
  setInstalledTitleIds,
  installedOtherModIds,
  setInstalledOtherModIds,
  onOpenAttire,
  onOpenArena,
  onOpenTitle,
  onOpenOtherMod,
  onOpenCollectionPicker
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

  function addToCollection(item) {
    if (!canContribute || !session || !item) return

    if (item.modType === 'attire') {
        onOpenCollectionPicker?.({
        ...item,
        id: item.id,
        name: item.title || item.name,
        modType: 'attire'
        })
        return
    }

    if (item.modType === 'arena') {
        onOpenCollectionPicker?.({
        ...item,
        id: item.id,
        name: item.title || item.name,
        modType: 'arena'
        })
        return
    }

    if (item.modType === 'title') {
        onOpenCollectionPicker?.({
        ...item,
        id: item.id,
        name: item.title || item.name,
        modType: 'title'
        })
        return
    }

    if (item.modType === 'other') {
        onOpenCollectionPicker?.({
        ...item,
        id: item.id,
        name: item.title || item.name,
        modType: 'other',
        subtype: item.modSubtype || item.subtype || ''
        })
    }
    
  }

  async function toggleInstalled(item) {
    if (!canContribute || !session || !item) return

    try {
        if (item.modType === 'attire') {
        const installed = installedIds.has(item.id)

        if (installed) {
            const { error } = await supabase
            .from('user_installed_attires')
            .delete()
            .eq('user_id', session.user.id)
            .eq('attire_id', item.id)

            if (error) throw error

            const next = new Set(installedIds)
            next.delete(item.id)
            setInstalledIds(next)

            openNotice('success', 'Removed from installed', `${item.title || item.name} is no longer marked as installed.`)
        } else {
            const { error } = await supabase
            .from('user_installed_attires')
            .insert({ user_id: session.user.id, attire_id: item.id })

            if (error) throw error

            const next = new Set(installedIds)
            next.add(item.id)
            setInstalledIds(next)

            openNotice('success', 'Marked as installed', `${item.title || item.name} is now marked as installed in your game.`)
        }

        return
        }

        if (item.modType === 'arena') {
        const installed = installedArenaIds.has(item.id)

        if (installed) {
            const { error } = await supabase
            .from('user_installed_arenas')
            .delete()
            .eq('user_id', session.user.id)
            .eq('arena_id', item.id)

            if (error) throw error

            const next = new Set(installedArenaIds)
            next.delete(item.id)
            setInstalledArenaIds(next)

            openNotice('success', 'Removed from installed', `${item.title || item.name} is no longer marked as installed.`)
        } else {
            const { error } = await supabase
            .from('user_installed_arenas')
            .insert({ user_id: session.user.id, arena_id: item.id })

            if (error) throw error

            const next = new Set(installedArenaIds)
            next.add(item.id)
            setInstalledArenaIds(next)

            openNotice('success', 'Marked as installed', `${item.title || item.name} is now marked as installed in your game.`)
        }

        return
        }

        if (item.modType === 'title') {
        const installed = installedTitleIds.has(item.id)

        if (installed) {
            const { error } = await supabase
            .from('user_installed_title_belts')
            .delete()
            .eq('user_id', session.user.id)
            .eq('title_belt_id', item.id)

            if (error) throw error

            const next = new Set(installedTitleIds)
            next.delete(item.id)
            setInstalledTitleIds(next)

            openNotice('success', 'Removed from installed', `${item.title || item.name} is no longer marked as installed.`)
        } else {
            const { error } = await supabase
            .from('user_installed_title_belts')
            .insert({ user_id: session.user.id, title_belt_id: item.id })

            if (error) throw error

            const next = new Set(installedTitleIds)
            next.add(item.id)
            setInstalledTitleIds(next)

            openNotice('success', 'Marked as installed', `${item.title || item.name} is now marked as installed in your game.`)
        }

        return
        }

        if (item.modType === 'other') {
        const installed = installedOtherModIds.has(item.id)

        if (installed) {
            const { error } = await supabase
            .from('user_installed_other_mods')
            .delete()
            .eq('user_id', session.user.id)
            .eq('other_mod_id', item.id)

            if (error) throw error

            const next = new Set(installedOtherModIds)
            next.delete(item.id)
            setInstalledOtherModIds(next)

            openNotice('success', 'Removed from installed', `${item.title || item.name} is no longer marked as installed.`)
        } else {
            const { error } = await supabase
            .from('user_installed_other_mods')
            .insert({ user_id: session.user.id, other_mod_id: item.id })

            if (error) throw error

            const next = new Set(installedOtherModIds)
            next.add(item.id)
            setInstalledOtherModIds(next)

            openNotice('success', 'Marked as installed', `${item.title || item.name} is now marked as installed in your game.`)
        }

        return
        }

        throw new Error(`Unsupported mod type: ${item.modType}`)
    } catch (err) {
        openNotice(
        'error',
        'Could not update install status',
        err.message || 'Could not update install status.'
        )
    }
  }

  const pagination = useMemo(() => {
    return paginateItems(filteredItems, page, perPage)
  }, [filteredItems, page])

  const trendingItems = useMemo(
    () => sortUnifiedMods(allMods, 'trending').slice(0, 8),
    [allMods]
  )

  const visibleFeaturedItems = !hasActiveFilters && page === 1 ? featuredItems : []
  const visibleLatestItems = !hasActiveFilters && page === 1 ? latestItems : []
  const visibleTrendingItems = !hasActiveFilters && page === 1 ? trendingItems : []

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
            trendingItems={visibleTrendingItems}
            onToggleInstalled={toggleInstalled}
            onAddToCollection={addToCollection}
        />
      </div>
    </div>
  )
}