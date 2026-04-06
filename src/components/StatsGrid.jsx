export default function StatsGrid({ stats }) {
  const items = [
    ['Wrestlers', stats.wrestlers],
    ['Attire mods', stats.attires],
    ['Open requests', stats.requests],
    ['No download link', stats.missingDownloads],
    ['Collections', stats.collections]
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
