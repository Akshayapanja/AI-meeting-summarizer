import './Card.css'

function AttendeesCard({ attendees }) {
  if (!attendees || attendees.length === 0) {
    return (
      <div className="card">
        <h2 className="card-title">Attendees</h2>
        <div className="card-content">
          <p className="empty-state">No attendees identified</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="card-title">Attendees</h2>
      <div className="card-content">
        <div className="attendees-list">
          {attendees.map((attendee, index) => (
            <span key={index} className="attendee-tag">
              {attendee}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AttendeesCard
