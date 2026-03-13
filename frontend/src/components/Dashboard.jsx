import { jsPDF } from 'jspdf'
import SummaryCard from './SummaryCard'
import ActionItemsCard from './ActionItemsCard'
import AttendeesCard from './AttendeesCard'
import KeyDecisionsCard from './KeyDecisionsCard'
import RisksCard from './RisksCard'
import SentimentCard from './SentimentCard'
import SpeakerContributionsCard from './SpeakerContributionsCard'
import './Dashboard.css'

function Dashboard({ results }) {
  const exportToPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const maxWidth = pageWidth - 2 * margin
    let yPos = margin

    // Helper function to add text with word wrap
    const addText = (text, fontSize = 12, isBold = false, color = [0, 0, 0]) => {
      doc.setFontSize(fontSize)
      doc.setTextColor(color[0], color[1], color[2])
      if (isBold) {
        doc.setFont(undefined, 'bold')
      } else {
        doc.setFont(undefined, 'normal')
      }
      
      const lines = doc.splitTextToSize(text, maxWidth)
      lines.forEach((line) => {
        if (yPos > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage()
          yPos = margin
        }
        doc.text(line, margin, yPos)
        yPos += fontSize * 0.5
      })
      yPos += 5
    }

    // Meeting Title
    addText(results.meeting_title || 'Meeting Summary', 20, true, [102, 126, 234])
    yPos += 5

    // Summary
    addText('Summary', 16, true)
    addText(results.summary || 'No summary available', 11)
    yPos += 5

    // Attendees
    addText('Attendees', 16, true)
    addText(results.attendees && results.attendees.length > 0 
      ? results.attendees.join(', ') 
      : 'No attendees identified', 11)
    yPos += 5

    // Action Items
    addText('Action Items', 16, true)
    if (results.action_items && results.action_items.length > 0) {
      results.action_items.forEach((item, index) => {
        const itemText = `${index + 1}. ${item.task}\n   Owner: ${item.owner} | Deadline: ${item.deadline} | Priority: ${item.priority}`
        addText(itemText, 11)
      })
    } else {
      addText('No action items identified', 11)
    }
    yPos += 5

    // Key Decisions
    addText('Key Decisions', 16, true)
    if (results.key_decisions && results.key_decisions.length > 0) {
      results.key_decisions.forEach((decision, index) => {
        addText(`${index + 1}. ${decision}`, 11)
      })
    } else {
      addText('No key decisions identified', 11)
    }
    yPos += 5

    // Risks
    addText('Risks', 16, true)
    if (results.risks && results.risks.length > 0) {
      results.risks.forEach((risk, index) => {
        addText(`${index + 1}. ${risk}`, 11)
      })
    } else {
      addText('No risks identified', 11)
    }
    yPos += 5

    // Sentiment
    addText('Sentiment', 16, true)
    addText(results.sentiment || 'Unknown', 11)
    yPos += 5

    // Speaker Contributions
    addText('Speaker Contributions', 16, true)
    if (results.speaker_contributions && results.speaker_contributions.length > 0) {
      results.speaker_contributions.forEach((contrib) => {
        addText(`${contrib.speaker}: ${contrib.percentage}%`, 11)
      })
    } else {
      addText('No speaker contributions identified', 11)
    }

    // Save PDF
    const fileName = `${(results.meeting_title || 'Meeting Summary').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">{results.meeting_title || 'Meeting Summary'}</h1>
        <button onClick={exportToPDF} className="download-pdf-button">
          📄 Download Report
        </button>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-card-full">
          <SummaryCard summary={results.summary} />
        </div>
        <div className="dashboard-card">
          <SentimentCard sentiment={results.sentiment} />
        </div>
        <div className="dashboard-card">
          <AttendeesCard attendees={results.attendees} />
        </div>
        {results.speaker_contributions && results.speaker_contributions.length > 0 && (
          <div className="dashboard-card">
            <SpeakerContributionsCard speakerContributions={results.speaker_contributions} />
          </div>
        )}
        <div className="dashboard-card-full">
          <ActionItemsCard actionItems={results.action_items} />
        </div>
        <div className="dashboard-card-full">
          <KeyDecisionsCard decisions={results.key_decisions} />
        </div>
        <div className="dashboard-card-full">
          <RisksCard risks={results.risks} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
