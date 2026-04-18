import React, { useState, useEffect } from 'react'
import api, { useStore } from '../store'
import styles from './QuizPage.module.css'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/errorMessage'

export default function QuizPage() {
  const { setQuizAnswers, runAllocation, goToStep, isCalculating } = useStore(s => ({
    setQuizAnswers: s.setQuizAnswers,
    runAllocation: s.runAllocation,
    goToStep: s.goToStep,
    isCalculating: s.isCalculating
  }))

  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    api.get('/allocation/questions')
      .then(r => setQuestions(r.data))
      .catch(() => {
        // Fallback questions
        setQuestions(FALLBACK_QUESTIONS)
      })
  }, [])

  const q = questions[current]
  const progress = questions.length > 0 ? ((current) / questions.length) * 100 : 0

  const handleSelect = (option) => {
    if (animating) return
    setSelected(option)
  }

  const handleNext = async () => {
    if (selected === null) { toast.error('Please select an answer'); return }

    const newAnswers = [...answers, { questionId: q.id, answer: selected.label, score: selected.score }]
    setAnswers(newAnswers)
    setAnimating(true)

    setTimeout(async () => {
      setSelected(null)
      setAnimating(false)

      if (current < questions.length - 1) {
        setCurrent(c => c + 1)
      } else {
        // Done — run allocation
        setQuizAnswers(newAnswers)
        try {
          await runAllocation()
        } catch (err) {
          toast.error(getErrorMessage(err, 'Allocation failed. Check backend connection.'))
        }
      }
    }, 300)
  }

  const avgScore = answers.length > 0
    ? Math.round(answers.reduce((s, a) => s + a.score, 0) / answers.length)
    : null

  const getRiskHint = (score) => {
    if (score === null) return null
    if (score >= 80) return { label: 'Very Aggressive', color: '#ef4444' }
    if (score >= 65) return { label: 'Aggressive', color: '#f59e0b' }
    if (score >= 50) return { label: 'Moderate Aggressive', color: '#d4af37' }
    if (score >= 30) return { label: 'Moderate Conservative', color: '#3b82f6' }
    return { label: 'Conservative', color: '#22c55e' }
  }

  const hint = getRiskHint(avgScore)

  if (questions.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading quiz...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => goToStep('profile')}>← Back</button>
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <span className={styles.progressText}>{current} of {questions.length}</span>
          </div>
          {hint && (
            <div className={styles.liveRisk} style={{ borderColor: hint.color + '40', color: hint.color }}>
              <div className={styles.liveDot} style={{ background: hint.color }} />
              {hint.label}
            </div>
          )}
        </div>

        {/* Question card */}
        <div className={`${styles.card} ${animating ? styles.cardExit : ''}`}>
          <div className={styles.qNum}>Question {current + 1} of {questions.length}</div>
          <h2 className={styles.question}>{q.question}</h2>

          <div className={styles.options}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`${styles.option} ${selected === opt ? styles.optionSelected : ''}`}
                onClick={() => handleSelect(opt)}
              >
                <div className={styles.optionIndicator}>
                  <div className={styles.optionDot} />
                </div>
                <span>{opt.label}</span>
                {selected === opt && <span className={styles.checkmark}>✓</span>}
              </button>
            ))}
          </div>

          <button
            className={styles.nextBtn}
            onClick={handleNext}
            disabled={selected === null || isCalculating}
          >
            {isCalculating ? (
              <>
                <div className={styles.spinner} />
                Analysing your profile...
              </>
            ) : current === questions.length - 1 ? (
              'Generate My Allocation →'
            ) : (
              'Next Question →'
            )}
          </button>
        </div>

        {/* Risk calibration bar */}
        {answers.length > 0 && (
          <div className={styles.calibration}>
            <div className={styles.calLabel}>Risk calibration (so far)</div>
            <div className={styles.riskBar}>
              <div className={styles.riskFill} style={{ width: `${avgScore}%` }} />
            </div>
            <div className={styles.riskScale}>
              <span>Conservative</span>
              <span>Moderate</span>
              <span>Aggressive</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const FALLBACK_QUESTIONS = [
  {
    id: 'q1',
    question: 'If your portfolio dropped 20% in one month, what would you do?',
    options: [
      { label: 'Buy more — great opportunity', score: 100 },
      { label: 'Hold — it will recover', score: 70 },
      { label: 'Sell some to reduce risk', score: 35 },
      { label: 'Sell all — preserve capital', score: 0 }
    ]
  },
  {
    id: 'q2',
    question: 'Your ₹10L portfolio drops to ₹7L temporarily. How do you feel?',
    options: [
      { label: 'Fine, markets recover long-term', score: 100 },
      { label: 'Uncomfortable but I\'ll hold', score: 65 },
      { label: 'Very stressed, considering exit', score: 30 },
      { label: 'Cannot handle this loss', score: 0 }
    ]
  },
  {
    id: 'q3',
    question: 'What is more important to you?',
    options: [
      { label: 'Growing wealth aggressively', score: 100 },
      { label: 'Balance of growth and safety', score: 65 },
      { label: 'Preserving what I have', score: 25 },
      { label: 'Not losing money at all', score: 0 }
    ]
  },
  {
    id: 'q4',
    question: 'How long can you leave money invested without needing it?',
    options: [
      { label: '10+ years easily', score: 100 },
      { label: '5–10 years', score: 75 },
      { label: '3–5 years', score: 45 },
      { label: 'Less than 3 years', score: 15 }
    ]
  },
  {
    id: 'q5',
    question: 'Have you ever exited an investment at a loss?',
    options: [
      { label: 'Never — I always hold through downturns', score: 90 },
      { label: 'Once, but regretted it', score: 60 },
      { label: 'Yes, when losses were too painful', score: 25 },
      { label: 'Yes, multiple times', score: 0 }
    ]
  },
  {
    id: 'q6',
    question: 'Which investment would you choose?',
    options: [
      { label: 'Potential 20% return with risk of -8%', score: 100 },
      { label: 'Potential 15% return with risk of -5%', score: 70 },
      { label: 'Potential 10% return with risk of -2%', score: 35 },
      { label: 'Guaranteed 7% return, no downside', score: 0 }
    ]
  }
]
