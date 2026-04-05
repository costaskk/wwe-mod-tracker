import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPanel() {
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

    if (mode === 'signup') {
      setMessage('Account created. If email confirmation is enabled, verify your email before signing in.')
    }

    setLoading(false)
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="eyebrow">SUPABASE + STORAGE</div>
        <h1>WWE 2K25 Mod Database</h1>
        <p className="muted">
          Track wrestlers, attire slots, creators, DDS renders, preview screenshots, movesets, and merged hype/DC profiles in one clean database.
        </p>

        <div className="segment-control">
          <button className={mode === 'signin' ? 'active' : ''} type="button" onClick={() => setMode('signin')}>
            Sign in
          </button>
          <button className={mode === 'signup' ? 'active' : ''} type="button" onClick={() => setMode('signup')}>
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </label>

          {error ? <div className="message error">{error}</div> : null}
          {message ? <div className="message success">{message}</div> : null}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
