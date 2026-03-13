import './Card.css'

function RisksCard({ risks }) {
  if (!risks || risks.length === 0) {
    return (
      <div className="card">
        <h2 className="card-title">Risks / Blockers</h2>
        <div className="card-content">
          <p className="empty-state">No risks or blockers identified</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="card-title">Risks / Blockers</h2>
      <div className="card-content">
        <ul className="risks-list">
          {risks.map((risk, index) => (
            <li key={index} className="risk-item">
              <span className="risk-icon">⚠️</span>
              {risk}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default RisksCard
