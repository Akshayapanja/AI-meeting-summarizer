import './Card.css'

function KeyDecisionsCard({ decisions }) {
  if (!decisions || decisions.length === 0) {
    return (
      <div className="card">
        <h2 className="card-title">Key Decisions</h2>
        <div className="card-content">
          <p className="empty-state">No key decisions identified</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="card-title">Key Decisions</h2>
      <div className="card-content">
        <ul className="decisions-list">
          {decisions.map((decision, index) => (
            <li key={index} className="decision-item">
              {decision}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default KeyDecisionsCard
