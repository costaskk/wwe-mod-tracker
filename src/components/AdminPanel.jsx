export default function AdminPanel({
  session,
  currentProfile,
  profiles,
  onUpdateProfile,
  updating
}) {
  if (!session || currentProfile?.role !== 'admin') return null

  return (
    <section className="panel soft-panel" id="admin-panel">
      <div className="panel-header">
        <div>
          <h2>Admin panel</h2>
          <p className="subtle-copy">
            Approve registrations, browse users, and assign roles.
          </p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="wrestler-table admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan="5" className="table-empty">No users found.</td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile.user_id}>
                  <td>{profile.email}</td>
                  <td>
                    <span className="pill">{profile.role}</span>
                  </td>
                  <td>
                    <span className={`pill ${profile.approval_status !== 'approved' ? 'danger-pill' : ''}`}>
                      {profile.approval_status}
                    </span>
                  </td>
                  <td>{new Date(profile.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-actions">
                      {profile.approval_status !== 'approved' ? (
                        <button
                          className="secondary-button small-btn"
                          disabled={updating}
                          onClick={() =>
                            onUpdateProfile(profile.user_id, { approval_status: 'approved' })
                          }
                        >
                          Approve
                        </button>
                      ) : null}

                      {profile.approval_status !== 'rejected' ? (
                        <button
                          className="ghost-button small-btn"
                          disabled={updating}
                          onClick={() =>
                            onUpdateProfile(profile.user_id, { approval_status: 'rejected' })
                          }
                        >
                          Reject
                        </button>
                      ) : null}

                      <select
                        className="admin-role-select"
                        value={profile.role}
                        disabled={updating}
                        onChange={(e) =>
                          onUpdateProfile(profile.user_id, { role: e.target.value })
                        }
                      >
                        <option value="user">user</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}