import './Card.css'

function SentimentCard({ sentiment }) {
  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'Positive':
        return '#4caf50'
      case 'Neutral':
        return '#ff9800'
      case 'Negative':
        return '#f44336'
      default:
        return '#808080'
    }
  }

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'Positive':
        return '😊'
      case 'Neutral':
        return '😐'
      case 'Negative':
        return '😟'
      default:
        return '❓'
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">Overall Sentiment</h2>
      <div className="card-content">
        <div className="sentiment-display">
          <div
            className="sentiment-badge"
            style={{ backgroundColor: getSentimentColor(sentiment) }}
          >
            <span className="sentiment-icon">{getSentimentIcon(sentiment)}</span>
            <span className="sentiment-text">{sentiment || 'Unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SentimentCard
