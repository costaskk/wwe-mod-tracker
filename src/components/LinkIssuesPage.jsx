import { requestSummary, parseDownloadLinks, getDownloadProvider, getDownloadProviderLabel, getDownloadProviderMark } from '../lib/utils'

export default function LinkIssuesPage({
  wrestlers,
  onResolveLink,
  onCreateRequest,
  canManageContent,
  onEditAttire
}) {
  const issues = wrestlers.flatMap((wrestler) =>
    (wrestler.attires || []).flatMap((attire) => {
      const summary = requestSummary(wrestler.requests || [], attire.id)
      const links = parseDownloadLinks(attire.download_url)
      const missing = links.length === 0
      const dead = summary.deadLinks > 0

      if (!missing && !dead) return []

      return [{
        wrestler,
        attire,
        issueType: dead ? 'dead_link' : 'missing_link',
        summary
      }]
    })
  )

  return (
    <section className="panel soft-panel">
      <div className="panel-header">
        <div>
          <div className="eyebrow">Maintenance</div>
          <h2>Link Issues</h2>
          <p className="subtle-copy">Browse missing and dead links across all wrestler mods.</p>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="empty-state">No issues found 🎉</div>
      ) : (
        <div className="link-issues-list">
          {issues.map((item) => (
            <div className="link-issue-card" key={item.attire.id}>
              <strong>{item.wrestler.wrestler_name}</strong>
              <h3>{item.attire.name}</h3>

              <p>{item.issueType === 'dead_link' ? 'Dead link' : 'Missing link'}</p>

               <div className="download-links-list">
                {parseDownloadLinks(item.attire.download_url).length ? (
                  parseDownloadLinks(item.attire.download_url).map((link, index) => {
                    const provider = getDownloadProvider(link)
                    return (
                      <div className={`download-link-chip provider-${provider}`} key={`${link}-${index}`}>
                        <span className="provider-mark">{getDownloadProviderMark(provider)}</span>
                        <span className="provider-label">{getDownloadProviderLabel(provider)}</span>
                      </div>
                    )
                  })
                ) : (
                  <span className="muted-text">No link</span>
                )}
              </div>

              <div className="link-issue-actions">
                <button className="secondary-button small-btn"
                  onClick={() =>
                    onResolveLink(item.wrestler, item.attire, item.issueType)
                  }
                >
                  Fix
                </button>

                <button className="ghost-button small-btn"
                  onClick={() =>
                    onCreateRequest(
                      item.wrestler.id,
                      item.attire.id,
                      item.issueType,
                      item.wrestler.wrestler_name,
                      item.attire.name
                    )
                  }
                >
                  Add note
                </button>

                {canManageContent(item.attire.owner_id) && (
                  <button className="ghost-button small-btn" onClick={() => onEditAttire(item.attire)}>
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}