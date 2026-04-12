import React, { useEffect } from 'react'
import { useStore } from './store'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import QuizPage from './pages/QuizPage'
import DashboardPage from './pages/DashboardPage'
import { Toaster } from 'react-hot-toast'

export default function App() {
  const currentStep = useStore(s => s.currentStep)

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f1929',
            color: '#f0f4f8',
            border: '1px solid rgba(212,175,55,0.2)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px'
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#0f1929' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0f1929' } }
        }}
      />

      {currentStep === 'login'     && <LoginPage />}
      {currentStep === 'profile'   && <ProfilePage />}
      {currentStep === 'quiz'      && <QuizPage />}
      {currentStep === 'dashboard' && <DashboardPage />}
    </>
  )
}
