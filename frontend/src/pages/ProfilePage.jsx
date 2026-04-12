import React, { useState } from 'react'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import styles from './ProfilePage.module.css'

const GOALS = [
  { value: 'retirement',       label: 'Retirement',        icon: '🏖️', desc: 'Build long-term wealth for retirement' },
  { value: 'child_education',  label: 'Child Education',   icon: '🎓', desc: 'Save for education expenses' },
  { value: 'home_purchase',    label: 'Home Purchase',     icon: '🏠', desc: 'Accumulate for down payment / full purchase' },
  { value: 'wealth_creation',  label: 'Wealth Creation',   icon: '📈', desc: 'Grow wealth aggressively over time' },
  { value: 'emergency_corpus', label: 'Emergency Corpus',  icon: '🛡️', desc: 'Build a safe liquid buffer' }
]

const INCOME_TYPES = [
  { value: 'salaried',   label: 'Salaried',   desc: 'Fixed monthly salary' },
  { value: 'business',   label: 'Business',   desc: 'Business / self-employed income' },
  { value: 'freelance',  label: 'Freelance',  desc: 'Variable / project-based income' }
]

const fmt = (v) => v ? `₹${Number(v).toLocaleString('en-IN')}` : ''

export default function ProfilePage() {
  const { userProfile, holdings, setUserInputs, goToStep } = useStore(s => ({
    userProfile: s.userProfile,
    holdings: s.holdings,
    setUserInputs: s.setUserInputs,
    goToStep: s.goToStep
  }))

  const [form, setForm] = useState({
    age: '',
    monthlyIncome: '',
    monthlyExpenses: '',
    monthlyEMI: '',
    monthlySIP: '',
    lumpsumAmount: '',
    goal: '',
    timeHorizon: '',
    incomeStability: '',
    emergencyFundMonths: ''
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const numVal = (e) => e.target.value.replace(/[^0-9]/g, '')

  const netSurplus = form.monthlyIncome && form.monthlyExpenses
    ? parseInt(form.monthlyIncome) - parseInt(form.monthlyExpenses || 0) - parseInt(form.monthlyEMI || 0)
    : null

  const validate = () => {
    const required = ['age','monthlyIncome','monthlyExpenses','monthlySIP','goal','timeHorizon','incomeStability','emergencyFundMonths']
    for (const k of required) {
      if (!form[k]) { toast.error(`Please fill in: ${k.replace(/([A-Z])/g, ' $1').toLowerCase()}`); return false }
    }
    if (parseInt(form.age) < 18 || parseInt(form.age) > 80) { toast.error('Age must be between 18 and 80'); return false }
    return true
  }

  const handleContinue = () => {
    if (!validate()) return
    setUserInputs({
      ...form,
      age: parseInt(form.age),
      monthlyIncome: parseInt(form.monthlyIncome),
      monthlyExpenses: parseInt(form.monthlyExpenses),
      monthlyEMI: parseInt(form.monthlyEMI || 0),
      monthlySIP: parseInt(form.monthlySIP),
      lumpsumAmount: parseInt(form.lumpsumAmount || 0),
      timeHorizon: parseInt(form.timeHorizon),
      emergencyFundMonths: parseInt(form.emergencyFundMonths)
    })
    goToStep('quiz')
  }

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarInner}>
          <div className={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <polygon points="16,2 30,26 2,26" stroke="#d4af37" strokeWidth="1.5" fill="none"/>
              <polygon points="16,8 25,24 7,24" fill="rgba(212,175,55,0.15)"/>
            </svg>
            <span>WEALTH ALLOCATOR</span>
          </div>

          <div className={styles.steps}>
            {['Profile', 'Risk Quiz', 'Dashboard'].map((s, i) => (
              <div key={s} className={`${styles.step} ${i === 0 ? styles.stepActive : ''}`}>
                <div className={styles.stepDot}>{i === 0 ? '1' : i + 1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>

          {/* Auto-filled info */}
          {userProfile && (
            <div className={styles.profileCard}>
              <div className={styles.profileName}>{userProfile.name || 'Angel One User'}</div>
              <div className={styles.profileSub}>Logged in via SmartAPI</div>
              {holdings.length > 0 && (
                <div className={styles.holdingsBadge}>
                  📊 {holdings.length} holdings imported
                </div>
              )}
            </div>
          )}

          <div className={styles.sideNote}>
            Your inputs are processed locally. Nothing is stored beyond your session.
          </div>
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Tell us about yourself</h1>
          <p className={styles.subtitle}>This shapes your entire allocation. Be as accurate as possible.</p>
        </div>

        <div className={styles.sections}>

          {/* ── Personal ── */}
          <Section title="Personal Details" icon="👤">
            <div className={styles.row2}>
              <Field label="Age">
                <input value={form.age} onChange={e => set('age', numVal(e))} placeholder="e.g. 32" maxLength={2} />
              </Field>
              <Field label="Emergency Fund" sublabel="months of expenses saved">
                <select value={form.emergencyFundMonths} onChange={e => set('emergencyFundMonths', e.target.value)}>
                  <option value="">Select</option>
                  <option value="0">None</option>
                  <option value="1">1 month</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12+ months</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* ── Income & Expenses ── */}
          <Section title="Income & Expenses" icon="💰">
            <div className={styles.row2}>
              <Field label="Monthly Income (Net)" sublabel="take-home / post-tax">
                <div className={styles.inputPrefix}>
                  <span>₹</span>
                  <input value={form.monthlyIncome} onChange={e => set('monthlyIncome', numVal(e))} placeholder="e.g. 150000" />
                </div>
              </Field>
              <Field label="Income Stability">
                <div className={styles.radioGroup}>
                  {INCOME_TYPES.map(t => (
                    <label key={t.value} className={`${styles.radioCard} ${form.incomeStability === t.value ? styles.radioSelected : ''}`}>
                      <input type="radio" name="incomeStability" value={t.value} checked={form.incomeStability === t.value} onChange={() => set('incomeStability', t.value)} />
                      <div className={styles.radioLabel}>{t.label}</div>
                      <div className={styles.radioDesc}>{t.desc}</div>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
            <div className={styles.row2}>
              <Field label="Monthly Expenses" sublabel="rent, food, utilities, etc.">
                <div className={styles.inputPrefix}>
                  <span>₹</span>
                  <input value={form.monthlyExpenses} onChange={e => set('monthlyExpenses', numVal(e))} placeholder="e.g. 60000" />
                </div>
              </Field>
              <Field label="Monthly EMI" sublabel="all loans combined (0 if none)">
                <div className={styles.inputPrefix}>
                  <span>₹</span>
                  <input value={form.monthlyEMI} onChange={e => set('monthlyEMI', numVal(e))} placeholder="e.g. 20000" />
                </div>
              </Field>
            </div>

            {netSurplus !== null && (
              <div className={`${styles.surplusBox} ${netSurplus < 0 ? styles.surplusNeg : netSurplus < 10000 ? styles.surplusWarn : styles.surplusOk}`}>
                <span>Net investable surplus</span>
                <strong>{netSurplus < 0 ? '⚠️ Deficit' : `₹${netSurplus.toLocaleString('en-IN')}/month`}</strong>
              </div>
            )}
          </Section>

          {/* ── Investment ── */}
          <Section title="Investment Details" icon="📊">
            <div className={styles.row2}>
              <Field label="Monthly SIP Amount">
                <div className={styles.inputPrefix}>
                  <span>₹</span>
                  <input value={form.monthlySIP} onChange={e => set('monthlySIP', numVal(e))} placeholder="e.g. 25000" />
                </div>
              </Field>
              <Field label="Lumpsum Available" sublabel="one-time investment (optional)">
                <div className={styles.inputPrefix}>
                  <span>₹</span>
                  <input value={form.lumpsumAmount} onChange={e => set('lumpsumAmount', numVal(e))} placeholder="e.g. 500000" />
                </div>
              </Field>
            </div>
            {form.lumpsumAmount >= 500000 && (
              <div className={styles.infoBadge}>
                💡 Corpus ≥ ₹5L — you qualify for direct stock recommendations
              </div>
            )}
          </Section>

          {/* ── Goal ── */}
          <Section title="Primary Financial Goal" icon="🎯">
            <div className={styles.goalGrid}>
              {GOALS.map(g => (
                <button
                  key={g.value}
                  className={`${styles.goalCard} ${form.goal === g.value ? styles.goalSelected : ''}`}
                  onClick={() => set('goal', g.value)}
                  type="button"
                >
                  <span className={styles.goalIcon}>{g.icon}</span>
                  <div className={styles.goalLabel}>{g.label}</div>
                  <div className={styles.goalDesc}>{g.desc}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* ── Time Horizon ── */}
          <Section title="Investment Time Horizon" icon="⏱️">
            <div className={styles.horizonGrid}>
              {[
                { value: '2', label: '< 3 years', note: 'Short term' },
                { value: '5', label: '3–7 years', note: 'Medium term' },
                { value: '10', label: '7–15 years', note: 'Long term' },
                { value: '20', label: '15+ years', note: 'Very long term' }
              ].map(h => (
                <button
                  key={h.value}
                  className={`${styles.horizonCard} ${form.timeHorizon === h.value ? styles.horizonSelected : ''}`}
                  onClick={() => set('timeHorizon', h.value)}
                  type="button"
                >
                  <div className={styles.horizonLabel}>{h.label}</div>
                  <div className={styles.horizonNote}>{h.note}</div>
                </button>
              ))}
            </div>
          </Section>

        </div>

        <div className={styles.footer}>
          <button className={styles.continueBtn} onClick={handleContinue}>
            Continue to Risk Quiz →
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span>{icon}</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, sublabel, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {label}
        {sublabel && <span className={styles.fieldSub}>{sublabel}</span>}
      </label>
      {children}
    </div>
  )
}
