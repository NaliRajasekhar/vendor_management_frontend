import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/login.css'
import { notifyError, notifySuccess } from '../lib/notify.js'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setLoading(true)
      await login(email, password)
      notifySuccess('Signed in successfully')
      nav('/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed'
      setError(msg)
      notifyError(msg)
    } finally { setLoading(false) }
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <h1 className="login-title">Login</h1>
        <form onSubmit={submit}>
          {error && <div className="alert error">{error}</div>}
          <label htmlFor="email" className="login-label">Email</label>
          <input id="email" type="email" className="login-input icon email-input" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@company.com" />

          <label htmlFor="password" className="login-label">Password</label>
          <input id="password" type="password" className="login-input" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />

          <button className="login-button" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  )
}
