import React, { useState } from 'react'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import styles from './LoginPage.module.css'
import { getErrorMessage } from '../utils/errorMessage'

export default function LoginPage() {
  const login = useStore(s => s.login)
  const [form, setForm] = useState({ clientId: '', password: '', totp: '' })
  const [loading, setLoading] = useState(false)
  const [demoMode, setDemoMode] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!form.clientId || !form.password || !form.totp) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await login(form.clientId, form.password, form.totp)
      toast.success('Authenticated successfully')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Login failed. Check your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  const handleDemoMode = () => {
    // Enter demo mode without real API
    useStore.setState({
      isAuthenticated: true,
      jwtToken: 'demo',
      clientId: 'DEMO',
      userProfile: { name: 'Demo User', email: 'demo@example.com' },
      holdings: [],
      recentOrders: [],
      currentStep: 'profile'
    })
    toast.success('Running in demo mode — no live market data')
  }

  return (
    <div className={styles.page}>
      {/* Background grid */}
      <div className={styles.grid} />
      <div className={styles.glow} />

      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <polygon points="16,2 30,26 2,26" stroke="#d4af37" strokeWidth="1.5" fill="none"/>
              <polygon points="16,8 25,24 7,24" fill="rgba(212,175,55,0.15)"/>
              <line x1="16" y1="2" x2="16" y2="26" stroke="#d4af37" strokeWidth="0.75" opacity="0.5"/>
            </svg>
          </div>
          <div>
            <div className={styles.logoTitle}>WEALTH ALLOCATOR</div>
            <div className={styles.logoSub}>AI Portfolio Engine</div>
          </div>
        </div>

        {/* Card */}
        <div className={styles.card}>
          <h1 className={styles.heading}>Connect your account</h1>
          <p className={styles.subheading}>
            Sign in with your Angel One credentials to auto-import your portfolio and get personalised allocation recommendations.
          </p>

          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Client ID</label>
              <input
                name="clientId"
                value={form.clientId}
                onChange={handleChange}
                placeholder="e.g. A123456"
                autoComplete="username"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>MPIN / Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your Angel One MPIN"
                autoComplete="current-password"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                TOTP
                <span className={styles.labelNote}>From your authenticator app</span>
              </label>
              <input
                name="totp"
                value={form.totp}
                onChange={handleChange}
                placeholder="6-digit code"
                maxLength={6}
                inputMode="numeric"
              />
            </div>

            <button className={styles.btn} type="submit" disabled={loading}>
              {loading ? <span className={styles.spinner}/> : null}
              {loading ? 'Connecting...' : 'Connect to Angel One'}
            </button>
          </form>

          <div className={styles.divider}><span>or</span></div>

          <button className={styles.demoBtn} onClick={handleDemoMode}>
            Continue in Demo Mode
          </button>

          <p className={styles.disclaimer}>
            🔒 Your credentials are used only to generate a session token via SmartAPI. 
            Nothing is stored on any server. No trades are placed.
          </p>
        </div>

        {/* Feature pills */}
        <div className={styles.pills}>
          {['Live portfolio sync', 'AI allocation engine', 'No trading executed', 'AMFI MF data'].map(f => (
            <span key={f} className={styles.pill}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
