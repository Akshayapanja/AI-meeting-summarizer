import './Card.css'

function SpeakerContributionsCard({ speakerContributions }) {
  if (!speakerContributions || speakerContributions.length === 0) {
    return (
      <div className="card">
        <h2 className="card-title">Speaker Contributions</h2>
        <div className="card-content">
          <p className="empty-state">No speaker contributions identified</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="card-title">Speaker Contributions</h2>
      <div className="card-content">
        <div className="speaker-contributions-list">
          {speakerContributions.map((contrib, index) => (
            <div key={index} className="speaker-contribution-item">
              <div className="speaker-contribution-header">
                <span className="speaker-name">{contrib.speaker}</span>
                <span className="speaker-percentage">{contrib.percentage}%</span>
              </div>
              <div className="speaker-progress-bar">
                <div
                  className="speaker-progress-fill"
                  style={{ width: `${contrib.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SpeakerContributionsCard
