export default function StatsGrid({ stats = {} }) {
  const items = [
    ['Wrestlers', stats.wrestlers ?? 0],
    ['Attire mods', stats.attires ?? 0],
    ['Open requests', stats.requests ?? 0],
    ['No download link', stats.missingDownloads ?? 0],
    ['Collections', stats.collections ?? 0]
  ]

  return (
    <section className="stats-grid stats-grid-five">
      {items.map(([label, value]) => (
        <div className="stat-card panel soft-panel" key={label}>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
        </div>
      ))}
    </section>
  )
}
