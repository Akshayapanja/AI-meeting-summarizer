import { useState } from 'react'
import './TranscriptInput.css'

function TranscriptInput({ transcript, setTranscript, onAnalyze, onFileSelect, loading }) {
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      if (onFileSelect) {
        onFileSelect(file)
      }
    }
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    if (onFileSelect) {
      onFileSelect(null)
    }
    // Reset file input
    const fileInput = document.getElementById('file-upload')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  return (
    <div className="transcript-input-container">
      <label htmlFor="file-upload" className="transcript-label">
        Upload Transcript File (Optional)
      </label>
      <div className="file-upload-section">
        <input
          id="file-upload"
          type="file"
          accept=".txt,.pdf,.docx"
          onChange={handleFileChange}
          disabled={loading}
          className="file-input"
        />
        {selectedFile && (
          <div className="file-info">
            <span className="file-name">{selectedFile.name}</span>
            <button
              type="button"
              onClick={handleClearFile}
              className="clear-file-button"
              disabled={loading}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <label htmlFor="transcript" className="transcript-label" style={{ marginTop: '1.5rem' }}>
        Or Paste Meeting Transcript
        {transcript.length > 0 && (
          <span className="char-count"> ({transcript.length.toLocaleString()} characters)</span>
        )}
      </label>
      <textarea
        id="transcript"
        className="transcript-textarea"
        placeholder="Paste your meeting transcript here..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        disabled={loading}
        rows={12}
      />
      <button
        className="analyze-button"
        onClick={onAnalyze}
        disabled={loading || (!transcript.trim() && !selectedFile)}
      >
        {loading ? 'Analyzing...' : 'Analyze Meeting'}
      </button>
    </div>
  )
}

export default TranscriptInput
