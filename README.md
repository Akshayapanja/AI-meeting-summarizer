# AI Meeting Summarizer

A complete full-stack web application that analyzes meeting transcripts using local AI inference with Ollama and Llama 3.2 model. No external APIs or API keys required.

## Features

- **Local AI Processing**: Uses Ollama with Llama 3.2 model running on your machine
- **File Upload Support**: Upload transcript files (.txt, .pdf, .docx) or paste text directly
- **AI-Generated Meeting Title**: Automatically generates a descriptive title for each meeting
- **Speaker Contribution Analysis**: Analyzes and displays contribution percentages for each speaker
- **PDF Export**: Download comprehensive meeting reports as PDF files
- **Structured Analysis**: Extracts key information from meeting transcripts
- **Modern UI**: Dark-themed, responsive dashboard with card-based layout
- **Comprehensive Insights**: 
  - AI-generated meeting title
  - Meeting summary
  - Action items with owners, deadlines, and priorities
  - Attendees list
  - Key decisions
  - Risks and blockers
  - Overall sentiment analysis
  - Speaker contribution percentages

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **AI**: Ollama with Llama 3.2 model

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Ollama** - [Download](https://ollama.ai/)

## Installation

### Step 1: Install Ollama

1. Download and install Ollama from [https://ollama.ai/](https://ollama.ai/)
2. Verify installation by running:
   ```bash
   ollama --version
   ```

### Step 2: Pull the Llama 3.2 Model

```bash
ollama pull llama3.2
```

This will download the model (approximately 2GB). Wait for the download to complete.

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

This will install:
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `axios` - HTTP client for Ollama API
- `multer` - File upload handling
- `pdf-parse` - PDF text extraction
- `mammoth` - DOCX text extraction

### Step 4: Install Frontend Dependencies

```bash
cd frontend
npm install
```

This will install:
- `react` & `react-dom` - React framework
- `jspdf` - PDF generation library

## Running the Application

### Start Ollama (if not already running)

Ollama should start automatically when installed. If not, start it manually:

```bash
ollama serve
```

The Ollama API will be available at `http://localhost:11434`

### Start the Backend Server

Open a terminal and run:

```bash
cd backend
npm start
```

The backend server will start on `http://localhost:3001`

### Start the Frontend Development Server

Open another terminal and run:

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in the terminal)

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. **Option A**: Upload a transcript file (.txt, .pdf, or .docx) using the file upload button
   **Option B**: Paste your meeting transcript into the textarea
3. Click "Analyze Meeting"
4. Wait for the AI to process the transcript (this may take 10-30 seconds depending on transcript length)
5. View the results in the dashboard with all extracted information:
   - AI-generated meeting title at the top
   - Meeting summary
   - Attendees, sentiment, and speaker contributions
   - Action items, key decisions, and risks
6. Click "Download Report" to export the meeting summary as a PDF file

## API Endpoints

### POST /analyze

Analyzes a meeting transcript and returns structured insights.

**Request (JSON):**
```json
{
  "transcript": "Meeting transcript text here..."
}
```

**Request (Multipart Form Data):**
- `file`: Transcript file (.txt, .pdf, or .docx)
- `transcript`: (Optional) Additional transcript text

**Response:**
```json
{
  "meeting_title": "Q4 Product Planning Discussion",
  "summary": "Meeting summary text",
  "attendees": ["John Doe", "Jane Smith"],
  "action_items": [
    {
      "task": "Complete project proposal",
      "owner": "John Doe",
      "deadline": "2024-03-15",
      "priority": "High"
    }
  ],
  "key_decisions": ["Decision 1", "Decision 2"],
  "risks": ["Risk 1", "Risk 2"],
  "sentiment": "Positive",
  "speaker_contributions": [
    {
      "speaker": "John Doe",
      "percentage": 45
    },
    {
      "speaker": "Jane Smith",
      "percentage": 55
    }
  ]
}
```

## Project Structure

```
meeting-summarizer/
├── backend/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── main.jsx
│       ├── index.css
│       └── components/
│           ├── TranscriptInput.jsx
│           ├── TranscriptInput.css
│           ├── Dashboard.jsx
│           ├── Dashboard.css
│           ├── SummaryCard.jsx
│           ├── ActionItemsCard.jsx
│           ├── AttendeesCard.jsx
│           ├── KeyDecisionsCard.jsx
│           ├── RisksCard.jsx
│           ├── SentimentCard.jsx
│           ├── SpeakerContributionsCard.jsx
│           └── Card.css
└── README.md
```

## Troubleshooting

### Ollama Connection Error

If you see "Cannot connect to Ollama" error:

1. Ensure Ollama is running:
   ```bash
   ollama serve
   ```

2. Verify the model is available:
   ```bash
   ollama list
   ```
   You should see `llama3.2` in the list.

3. Test Ollama API directly:
   ```bash
   curl http://localhost:11434/api/tags
   ```

### Model Not Found

If you get a "model not found" error:

```bash
ollama pull llama3.2
```

### Port Already in Use

If port 3001 (backend) or 5173 (frontend) is already in use:

- **Backend**: Edit `backend/server.js` and change `PORT` constant
- **Frontend**: Edit `frontend/vite.config.js` and change the `port` in server config

### Slow Processing

- Large transcripts may take longer to process (30-60 seconds)
- Ensure your system has sufficient RAM (Llama 3.2 requires ~4GB)
- Close other applications to free up resources

### JSON Parsing Errors

If you encounter JSON parsing errors:

- The AI model may occasionally return malformed JSON
- Try re-running the analysis
- Check that your transcript is clear and well-formatted

## Development

### Backend Development

The backend uses ES modules. To run with auto-reload:

```bash
cd backend
npm run dev
```

### Frontend Development

The frontend uses Vite for fast hot module replacement. Changes will automatically reload in the browser.

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

## License

ISC

## Contributing

Feel free to submit issues and enhancement requests!
