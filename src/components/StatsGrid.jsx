export default function StatsGrid({ stats }) {
  const items = [
    ['Wrestlers', stats.totalMods],
    ['Attires', stats.totalAttires],
    ['Incomplete Attires', stats.incompleteAttires],
    ['Missing Targets', stats.missingTargets],
    ['Attire Gap', stats.attireGap]
  ]

  return (
    <section className="stats-grid">
      {items.map(([label, value]) => (
        <article key={label} className="stat-card">
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
        </article>
      ))}
    </section>
  )
}
