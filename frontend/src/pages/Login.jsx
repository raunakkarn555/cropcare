// by Raunak
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email.trim(), password) // success par GuestOnly khud Home par bhej deta hai
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-logo"><Icon name="leaf" size={30} /></div>
        <h1 className="auth-title">Crop Care</h1>
        <p className="auth-sub">Your farm, on schedule</p>

        <label className="label" htmlFor="email">Email</label>
        <input id="email" className="input" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />

        <label className="label" htmlFor="pw">Password</label>
        <div className="input-wrap">
          <input id="pw" className="input" type={show ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          <button type="button" className="input-action" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
        </div>

        {/* Backend me forgot-password ka API nahi hai, isliye abhi sirf message dikhate hain */}
        <button type="button" className="link-btn right" onClick={() => toast('Password reset is not available yet')}>Forgot password?</button>

        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="auth-foot">Don't have an account? <Link to="/register">Register</Link></p>
      </form>
    </div>
  )
}
