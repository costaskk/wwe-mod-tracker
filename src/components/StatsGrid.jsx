import { AlertCircle, Database, Shirt, Star, Users } from 'lucide-react'

const statIcons = {
  Wrestlers: Users,
  Attires: Shirt,
  'Incomplete Attires': AlertCircle,
  'Missing Targets': Star,
  'Attire Gap': Database,
}

export default function StatsGrid({ stats }) {
  return (
    <section className="stats-grid">
      {stats.map((stat) => {
        const Icon = statIcons[stat.label]
        return (
          <article className="panel stat-card" key={stat.label}>
            <div>
              <p className="stat-label">{stat.label}</p>
              <h3>{stat.value}</h3>
            </div>
            <div className="icon-shell">
              <Icon size={20} />
            </div>
          </article>
        )
      })}
    </section>
  )
}
