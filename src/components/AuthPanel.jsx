import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPanel({ session, currentProfile }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      let authError = null

      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        })
        authError = error
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password
        })
        authError = error
      }

      if (authError) {
        setError(authError.message)
        return
      }

      if (mode === 'signup') {
        setShowSuccessModal(true)

        // Optional: reset form
        setEmail('')
        setPassword('')

        // Optional: switch back to signin tab
        setMode('signin')
      } else {
        setMessage('Signed in.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (showSuccessModal) {
    return (
      <div className="modal-backdrop">
        <div className="panel modal-card small-modal success-modal">
          <div className="modal-header">
            <h2>🎉 Registration successful</h2>
            <p className="subtle-copy">
              Your account has been created successfully.
            </p>
          </div>

          <div className="modal-body">
            <p>
              An admin must approve your account before you can contribute content.
            </p>

            <div className="notice-box">
              You can already sign in and browse normally.
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="primary-button"
              onClick={() => setShowSuccessModal(false)}
            >
              Continue to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (session) {
    if (
      currentProfile &&
      currentProfile.approval_status !== 'approved' &&
      currentProfile.role !== 'admin'
    ) {
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
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
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
            <button type="submit" className="primary-button" disabled={loading}>
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