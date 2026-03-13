import './Card.css'

function ActionItemsCard({ actionItems }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#f44336'
      case 'Medium':
        return '#ff9800'
      case 'Low':
        return '#4caf50'
      default:
        return '#808080'
    }
  }

  if (!actionItems || actionItems.length === 0) {
    return (
      <div className="card">
        <h2 className="card-title">Action Items</h2>
        <div className="card-content">
          <p className="empty-state">No action items identified</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="card-title">Action Items</h2>
      <div className="card-content">
        <div className="action-items-list">
          {actionItems.map((item, index) => (
            <div key={index} className="action-item">
              <div className="action-item-header">
                <span className="action-item-task">{item.task}</span>
                <span
                  className="action-item-priority"
                  style={{ backgroundColor: getPriorityColor(item.priority) }}
                >
                  {item.priority}
                </span>
              </div>
              <div className="action-item-details">
                <div className="action-item-detail">
                  <span className="detail-label">Owner:</span>
                  <span className="detail-value">{item.owner}</span>
                </div>
                <div className="action-item-detail">
                  <span className="detail-label">Deadline:</span>
                  <span className="detail-value">{item.deadline}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ActionItemsCard
