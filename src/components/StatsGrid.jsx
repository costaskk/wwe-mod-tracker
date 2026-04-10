import { useEffect, useMemo, useState } from 'react'

function CountUpValue({ value, duration = 900 }) {
  const safeValue = Number(value) || 0
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let animationFrameId = 0
    let startTime = 0
    const startValue = 0

    function step(timestamp) {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const nextValue = Math.round(startValue + (safeValue - startValue) * easedProgress)

      setDisplayValue(nextValue)

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step)
      }
    }

    setDisplayValue(0)
    animationFrameId = window.requestAnimationFrame(step)

    return () => window.cancelAnimationFrame(animationFrameId)
  }, [safeValue, duration])

  return displayValue.toLocaleString()
}

export default function StatsGrid({ stats = {} }) {
  const items = useMemo(
    () => [
      {
        key: 'totalMods',
        label: 'Total mods',
        value: stats.totalMods ?? 0,
        icon: '📊',
        primary: true
      },
      {
        key: 'wrestlers',
        label: 'Wrestlers',
        value: stats.wrestlers ?? 0,
        icon: '🧍'
      },
      {
        key: 'attires',
        label: 'Attire mods',
        value: stats.attires ?? 0,
        icon: '👕'
      },
      {
        key: 'arenas',
        label: 'Arena mods',
        value: stats.arenas ?? 0,
        icon: '🏟️'
      },
      {
        key: 'titleBelts',
        label: 'Title belts',
        value: stats.titleBelts ?? 0,
        icon: '🏆'
      },
      {
        key: 'otherMods',
        label: 'Other mods',
        value: stats.otherMods ?? 0,
        icon: '🧩'
      },
      {
        key: 'missingDownloads',
        label: 'Issues/Dead Links',
        value: stats.missingDownloads ?? 0,
        icon: '⚠️'
      },
      {
        key: 'collections',
        label: 'Total Collections',
        value: stats.collections ?? 0,
        icon: '📁'
      }
    ],
    [stats]
  )

  return (
    <section className={`stats-grid ${items.length >= 8 ? 'stats-grid-eight' : 'stats-grid-seven'}`}>
      {items.map((item) => (
        <div
          className={`stat-card panel soft-panel ${item.primary ? 'stat-card-primary' : 'stat-card-standard'}`}
          key={item.key}
        >
          <div className="stat-label">
            <span className="stat-label-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </div>

          <div className="stat-value">
            <CountUpValue value={item.value} duration={item.primary ? 1200 : 900} />
          </div>
        </div>
      ))}
    </section>
  )
}