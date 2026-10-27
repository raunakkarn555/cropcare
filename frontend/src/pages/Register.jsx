// by Raunak
// Figma me register screen nahi thi, isliye login jaisa hi style rakha hai
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icons'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    // backend rules: name 2+ chars, password 8+ chars
    if (form.name.trim().length < 2) return setError('Name must be at least 2 characters')
    if (form.password.length < 8) return setError('Password must be at least 8 characters')
    setBusy(true)
    try {
      await register(form.name.trim(), form.email.trim(), form.password)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-logo"><Icon name="leaf" size={30} /></div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Start managing your farm</p>

        <label className="label" htmlFor="name">Full name</label>
        <input id="name" className="input" placeholder="Your name" value={form.name} onChange={set('name')} required autoComplete="name" />

        <label className="label" htmlFor="remail">Email</label>
        <input id="remail" className="input" type="email" placeholder="name@example.com" value={form.email} onChange={set('email')} required autoComplete="email" />

        <label className="label" htmlFor="rpw">Password</label>
        <input id="rpw" className="input" type="password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} required autoComplete="new-password" />

        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
        <p className="auth-foot">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  )
}
