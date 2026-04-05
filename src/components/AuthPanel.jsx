import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPanel({ session }) {
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

    const action = mode === 'signin'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })

    const { error: authError } = await action

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setMessage(mode === 'signup' ? 'Account created. Check your email if confirmation is enabled.' : 'Signed in.')
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (session) {
    return (
      <div className="auth-inline">
        <div className="auth-user">
          Signed in as <strong>{session.user.email}</strong>
        </div>
        <button className="secondary-button" onClick={handleSignOut}>Sign out</button>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <div className="auth-head">
        <div>
          <h2>Contribute to the database</h2>
          <p>Browse is public. Sign in to add wrestlers, add attires, mark installs, and create requests.</p>
        </div>
      </div>

      <div className="segment-control">
        <button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Sign in</button>
        <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Create account</button>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        <button className="primary-button" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {message ? <div className="message success">{message}</div> : null}
      {error ? <div className="message error">{error}</div> : null}
    </div>
  )
}
