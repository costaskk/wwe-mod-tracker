export default function StatsGrid({ stats = {} }) {
  const items = [
    {
      key: 'wrestlers',
      label: 'Wrestlers',
      value: stats.wrestlers ?? 0
    },
    {
      key: 'attires',
      label: 'Attire mods',
      value: stats.attires ?? 0
    },
    {
      key: 'arenas',
      label: 'Arena mods',
      value: stats.arenas ?? 0
    },
    {
      key: 'titleBelts',
      label: 'Title belts',
      value: stats.titleBelts ?? 0
    },
    {
      key: 'totalMods',
      label: 'Total mods',
      value: stats.totalMods ?? 0
    },
    {
      key: 'requests',
      label: 'Open requests',
      value: stats.requests ?? 0
    },
    {
      key: 'missingDownloads',
      label: 'No download link',
      value: stats.missingDownloads ?? 0
    },
    {
      key: 'collections',
      label: 'Collections',
      value: stats.collections ?? 0
    }
  ]

  return (
    <section className={`stats-grid ${items.length >= 8 ? 'stats-grid-eight' : 'stats-grid-seven'}`}>
      {items.map((item) => (
        <div className="stat-card panel soft-panel" key={item.key}>
          <div className="stat-label">{item.label}</div>
          <div className="stat-value">{item.value}</div>
        </div>
      ))}
    </section>
  )
}