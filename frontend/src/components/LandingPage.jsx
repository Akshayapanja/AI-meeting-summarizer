import './LandingPage.css'

function LandingPage({ onGetStarted }) {
  const featuresBox1 = [
    'AI-Generated Meeting Titles',
    'Comprehensive Summaries',
    'Action Items Extraction',
    'Key Decisions Tracking'
  ]

  const whyToUse = [
    'Save time with automated analysis',
    'Privacy-first local AI processing',
    'No API keys or external services',
    'Professional PDF reports'
  ]

  const featuresBox3 = [
    'Speaker Contribution Analysis',
    'Sentiment Analysis',
    'PDF Export',
    'Risk & Blocker Detection'
  ]

  const howItWorks = [
    'Step 1: Upload or paste transcript',
    'Step 2: AI analyzes content',
    'Step 3: View comprehensive insights',
    'Step 4: Export as PDF report'
  ]

  return (
    <div className="landing-page">
      {/* Animated Background Elements */}
      <div className="background-effects">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
        <div className="floating-orb orb-4"></div>
        <div className="grid-pattern"></div>
        <div className="glow-effect glow-1"></div>
        <div className="glow-effect glow-2"></div>
        <div className="glow-effect glow-3"></div>
      </div>

      {/* Header/Logo */}
      <header className="landing-header">
        <div className="logo-container">
          <div className="logo-icon">🤖</div>
          <div className="logo-text">AI MEETING SUMMARIZER</div>
        </div>
      </header>

      {/* Main Content Section with 2x2 Grid */}
      <section className="main-content-section">
        <div className="content-container">
          <h1 className="main-title">
            <span className="title-line-1">Turn long meeting transcripts</span>
            <span className="title-line-2">into summaries</span>
          </h1>
          
          <div className="grid-container">
            {/* Box 01 - Features (Top Left) */}
            <div className="content-box box-01">
              <div className="box-number">01</div>
              <h2 className="box-title">Features</h2>
              <ul className="box-list">
                {featuresBox1.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            {/* Box 02 - Why to Use (Top Right) */}
            <div className="content-box box-02">
              <div className="box-number">02</div>
              <h2 className="box-title">Why to Use</h2>
              <ul className="box-list">
                {whyToUse.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>

            {/* Center Button */}
            <div className="center-button-container">
              <div className="button-glow"></div>
              <button className="center-cta-button" onClick={onGetStarted}>
                <span className="button-text">Try with AI</span>
                <span className="button-arrow">→</span>
              </button>
            </div>

            {/* AI Chatbots Visual Element */}
            <div className="ai-chatbots-container">
              <div className="ai-chatbot-stack">
                <div className="glow-ring ring-1"></div>
                <div className="glow-ring ring-2"></div>
                <div className="ai-chatbot-bot bot-1">
                  <div className="bot-face">
                    <div className="bot-eyes">
                      <div className="bot-eye"></div>
                      <div className="bot-eye"></div>
                    </div>
                    <div className="bot-mouth"></div>
                  </div>
                  <div className="bot-accent"></div>
                  <div className="bot-details">
                    <div className="bot-detail-dot"></div>
                    <div className="bot-detail-dot"></div>
                    <div className="bot-detail-dot"></div>
                  </div>
                </div>
                <div className="ai-chatbot-bot bot-2">
                  <div className="bot-face">
                    <div className="bot-eyes">
                      <div className="bot-eye"></div>
                      <div className="bot-eye"></div>
                    </div>
                    <div className="bot-mouth"></div>
                  </div>
                  <div className="bot-accent"></div>
                  <div className="bot-details">
                    <div className="bot-detail-dot"></div>
                    <div className="bot-detail-dot"></div>
                    <div className="bot-detail-dot"></div>
                  </div>
                </div>
                <div className="ai-chatbot-bot bot-3">
                  <div className="bot-face">
                    <div className="bot-eyes">
                      <div className="bot-eye"></div>
                      <div className="bot-eye"></div>
                    </div>
                    <div className="bot-mouth"></div>
                  </div>
                  <div className="bot-accent"></div>
                  <div className="bot-details">
                    <div className="bot-detail-dot"></div>
                    <div className="bot-detail-dot"></div>
                    <div className="bot-detail-dot"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 03 - Highlights (Bottom Left) */}
            <div className="content-box box-03">
              <div className="box-number">03</div>
              <h2 className="box-title">Highlights</h2>
              <ul className="box-list">
                {featuresBox3.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            {/* Box 04 - How It Works (Bottom Right) */}
            <div className="content-box box-04">
              <div className="box-number">04</div>
              <h2 className="box-title">How It Works</h2>
              <ul className="box-list">
                {howItWorks.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
