import { useState } from 'react'
import LandingPage from './components/LandingPage'
import TranscriptInput from './components/TranscriptInput'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [transcript, setTranscript] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progressStage, setProgressStage] = useState('')
  const [progressMessage, setProgressMessage] = useState('')
  const [transcriptLength, setTranscriptLength] = useState(0)

  const handleFileSelect = (file) => {
    setSelectedFile(file)
  }

  const handleAnalyze = async () => {
    if (!transcript.trim() && !selectedFile) {
      setError('Please enter a meeting transcript or upload a file')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)
    
    // Calculate transcript length for progress estimation
    const estimatedLength = selectedFile ? selectedFile.size / 2 : transcript.length
    setTranscriptLength(estimatedLength)
    setProgressStage('extracting')
    setProgressMessage('Extracting text from file...')

    try {
      let response

      // Create AbortController for timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 600000) // 10 minute timeout

      try {
        setProgressStage('preparing')
        setProgressMessage('Preparing analysis...')
        
        if (selectedFile) {
          // Use FormData for file upload
          const formData = new FormData()
          formData.append('file', selectedFile)
          
          // Also append transcript text if provided
          if (transcript.trim()) {
            formData.append('transcript', transcript)
          }

          response = await fetch('http://localhost:3001/analyze', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          })
        } else {
          // Use JSON for text-only input
          response = await fetch('http://localhost:3001/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ transcript }),
            signal: controller.signal,
          })
        }
        
        setProgressStage('analyzing')
        setProgressMessage('Analyzing with AI...')
      } finally {
        clearTimeout(timeoutId)
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze transcript')
      }

      setProgressStage('processing')
      setProgressMessage('Processing results...')
      
      const data = await response.json()
      setResults(data)
      
      setProgressStage('complete')
      setProgressMessage('Analysis complete!')
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timeout. The transcript may be too long. Please try with a shorter transcript or wait a moment and try again.')
      } else {
        setError(err.message || 'An error occurred while analyzing the transcript')
      }
      console.error('Error:', err)
    } finally {
      setLoading(false)
      setProgressStage('')
      setProgressMessage('')
    }
  }

  const handleGetStarted = () => {
    setCurrentPage('upload')
  }

  const handleBackToHome = () => {
    setCurrentPage('landing')
    setTranscript('')
    setSelectedFile(null)
    setResults(null)
    setError(null)
    setLoading(false)
    setProgressStage('')
    setProgressMessage('')
    setTranscriptLength(0)
  }

  if (currentPage === 'landing') {
    return (
      <div className="app">
        <LandingPage onGetStarted={handleGetStarted} />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <button className="back-to-home-button" onClick={handleBackToHome}>
          ← Back to Home
        </button>
        <div className="header-content">
          <h1>AI Meeting Summarizer</h1>
          <p>Analyze meeting transcripts with local AI</p>
        </div>
      </header>

      <main className="app-main">
        <TranscriptInput
          transcript={transcript}
          setTranscript={setTranscript}
          onAnalyze={handleAnalyze}
          onFileSelect={handleFileSelect}
          loading={loading}
        />

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-message">{progressMessage || 'Analyzing meeting transcript...'}</p>
            {transcriptLength > 0 && (
              <div className="loading-info">
                <span className="transcript-length">Transcript: {transcriptLength.toLocaleString()} characters</span>
                {transcriptLength > 8000 && (
                  <span className="optimization-note">(Large transcript - optimizing for faster processing)</span>
                )}
              </div>
            )}
            <div className="progress-stages">
              <div className={`progress-stage ${progressStage === 'extracting' ? 'active' : progressStage === 'preparing' || progressStage === 'analyzing' || progressStage === 'processing' || progressStage === 'complete' ? 'completed' : ''}`}>
                <span className="stage-icon">📄</span>
                <span className="stage-label">Extract</span>
              </div>
              <div className={`progress-stage ${progressStage === 'preparing' ? 'active' : progressStage === 'analyzing' || progressStage === 'processing' || progressStage === 'complete' ? 'completed' : ''}`}>
                <span className="stage-icon">⚙️</span>
                <span className="stage-label">Prepare</span>
              </div>
              <div className={`progress-stage ${progressStage === 'analyzing' ? 'active' : progressStage === 'processing' || progressStage === 'complete' ? 'completed' : ''}`}>
                <span className="stage-icon">🤖</span>
                <span className="stage-label">Analyze</span>
              </div>
              <div className={`progress-stage ${progressStage === 'processing' ? 'active' : progressStage === 'complete' ? 'completed' : ''}`}>
                <span className="stage-icon">✅</span>
                <span className="stage-label">Process</span>
              </div>
            </div>
          </div>
        )}

        {results && !loading && <Dashboard results={results} />}
      </main>
    </div>
  )
}

export default App
