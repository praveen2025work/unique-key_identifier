'use client'

import { useState } from 'react'
import FileComparisonApp from '../src/components/FileComparisonApp'
import WorkflowScreen from '../src/components/WorkflowScreen'

type Screen = 'home' | 'workflow' | 'results'

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const [currentRunId, setCurrentRunId] = useState<number | null>(null)
  const [apiEndpoint] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('apiEndpoint') || 'http://localhost:8000'
    }
    return 'http://localhost:8000'
  })

  const handleAnalysisStarted = (runId: number) => {
    setCurrentRunId(runId)
    setCurrentScreen('workflow')
  }

  const handleViewResults = () => {
    setCurrentScreen('results')
  }

  const handleBackToHome = () => {
    setCurrentScreen('home')
    setCurrentRunId(null)
  }

  return (
    <>
      {currentScreen === 'home' && (
        <FileComparisonApp onAnalysisStarted={handleAnalysisStarted} />
      )}
      
      {currentScreen === 'workflow' && currentRunId && (
        <WorkflowScreen
          runId={currentRunId}
          apiEndpoint={apiEndpoint}
          onBack={handleBackToHome}
          onViewResults={handleViewResults}
        />
      )}

      {currentScreen === 'results' && currentRunId && (
        <FileComparisonApp onAnalysisStarted={handleAnalysisStarted} initialRunId={currentRunId} />
      )}
    </>
  )
}

