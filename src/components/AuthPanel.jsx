import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPanel({ session, currentProfile }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const action =
      mode === 'signin'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password })

    const { error: authError } = await action

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setMessage(
      mode === 'signup'
        ? 'Account created. An admin must approve it before you can contribute.'
        : 'Signed in.'
    )
    setLoading(false)
  }

  if (session) {
    if (currentProfile && currentProfile.approval_status !== 'approved') {
      return (
        <div className="auth-card compact-auth-card">
          <div className="auth-head compact-auth-head">
            <div>
              <h3>Account pending approval</h3>
              <p>
                You are signed in as <strong>{session.user.email}</strong>, but an admin must approve your
                account before you can add or edit content.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="auth-card compact-auth-card">
      <div className="auth-head compact-auth-head">
        <div>
          <h3>Sign in to contribute</h3>
          <p>Browsing is public. Contributing requires sign-in and admin approval.</p>
        </div>
      </div>

      <div className="segment-control compact-segment">
        <button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>
          Sign in
        </button>
        <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-grid compact-auth-form">
        <div className="compact-grid compact-grid-3">
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          <div className="auth-submit-wrap">
            <button type="button" className="primary-button" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </div>
        </div>
      </form>

      {message ? <div className="message success">{message}</div> : null}
      {error ? <div className="message error">{error}</div> : null}
    </div>
  )
}