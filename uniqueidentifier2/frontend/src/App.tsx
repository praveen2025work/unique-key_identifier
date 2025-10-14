import React, { useState } from 'react';
import FileComparisonApp from './components/FileComparisonApp';
import WorkflowScreen from './components/WorkflowScreen';
import './index.css';

type Screen = 'home' | 'workflow' | 'results';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [currentRunId, setCurrentRunId] = useState<number | null>(null);
  const [apiEndpoint] = useState(() => localStorage.getItem('apiEndpoint') || 'http://localhost:8000');

  const handleAnalysisStarted = (runId: number) => {
    setCurrentRunId(runId);
    setCurrentScreen('workflow');
  };

  const handleViewResults = () => {
    setCurrentScreen('results');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setCurrentRunId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-800">
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
    </div>
  );
}

export default App;
