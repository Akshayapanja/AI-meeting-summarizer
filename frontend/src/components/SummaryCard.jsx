import './Card.css'

function SummaryCard({ summary }) {
  return (
    <div className="card">
      <h2 className="card-title">Meeting Summary</h2>
      <div className="card-content">
        <p className="summary-text">{summary || 'No summary available'}</p>
      </div>
    </div>
  )
}

export default SummaryCard
