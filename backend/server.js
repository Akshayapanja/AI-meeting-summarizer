import express from 'express';
import cors from 'cors';
import axios from 'axios';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const app = express();
const PORT = 3001;
const OLLAMA_URL = 'http://localhost:11434/api/generate';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.pdf', '.docx'];
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .txt, .pdf, and .docx files are allowed.'));
    }
  }
});

// File parsing functions
const parseTextFile = async (buffer) => {
  try {
    const text = buffer.toString('utf-8');
    
    // Validate that text is not empty
    if (text.trim().length === 0) {
      throw new Error('Text file appears to be empty.');
    }
    
    return text;
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error.message.includes('empty')) {
      throw error;
    }
    // Otherwise, wrap the error
    throw new Error(`Failed to parse text file: ${error.message}`);
  }
};

const parsePdfFile = async (buffer) => {
  try {
    console.log('Starting PDF parsing, buffer size:', buffer.length);
    const data = await pdfParse(buffer);
    
    console.log('PDF parsed, checking data:', {
      hasData: !!data,
      hasText: data?.text !== undefined,
      textType: typeof data?.text,
      textLength: data?.text?.length || 0
    });
    
    // Validate that data exists and has a text property
    if (!data) {
      console.error('PDF parsing returned no data object');
      throw new Error('PDF parsing returned no data');
    }
    
    // Check if text property exists and is a string
    if (data.text === undefined || data.text === null) {
      console.error('PDF text property is undefined or null');
      throw new Error('PDF does not contain extractable text. The PDF may be image-based (scanned) or corrupted. Please ensure the PDF contains selectable text.');
    }
    
    // Ensure text is a string
    const text = typeof data.text === 'string' ? data.text : String(data.text || '');
    
    console.log('PDF text extracted, length:', text.length, 'trimmed length:', text.trim().length);
    
    // Check if text is empty after trimming
    if (text.trim().length === 0) {
      console.error('PDF text is empty after trimming');
      throw new Error('PDF appears to be empty or contains no readable text. Please ensure the PDF contains text content.');
    }
    
    return text;
  } catch (error) {
    console.error('PDF parsing error:', error.message);
    // If it's already our custom error, re-throw it
    if (error.message.includes('PDF') || error.message.includes('extractable') || error.message.includes('empty')) {
      throw error;
    }
    // Otherwise, wrap the error with more context
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

const parseDocxFile = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    
    // Validate that result exists and has a value property
    if (!result) {
      throw new Error('DOCX parsing returned no data');
    }
    
    // Check if value property exists
    if (result.value === undefined || result.value === null) {
      throw new Error('DOCX file does not contain extractable text or is corrupted.');
    }
    
    // Ensure value is a string
    const text = typeof result.value === 'string' ? result.value : String(result.value || '');
    
    // Check if text is empty after trimming
    if (text.trim().length === 0) {
      throw new Error('DOCX file appears to be empty or contains no readable text.');
    }
    
    return text;
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error.message.includes('DOCX') || error.message.includes('extractable') || error.message.includes('empty')) {
      throw error;
    }
    // Otherwise, wrap the error with more context
    throw new Error(`Failed to parse DOCX: ${error.message}`);
  }
};

// Extract transcript text from uploaded file
const extractTextFromFile = async (file) => {
  console.log('extractTextFromFile called with:', {
    hasFile: !!file,
    hasBuffer: !!file?.buffer,
    bufferLength: file?.buffer?.length || 0,
    fileName: file?.originalname
  });
  
  if (!file) {
    throw new Error('Invalid file: file object is missing');
  }
  
  if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new Error('Invalid file: file buffer is missing or invalid');
  }
  
  if (file.buffer.length === 0) {
    throw new Error('Invalid file: file buffer is empty');
  }
  
  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  console.log('File extension:', ext);
  
  let text;
  try {
    switch (ext) {
      case '.txt':
        console.log('Parsing as text file');
        text = await parseTextFile(file.buffer);
        break;
      case '.pdf':
        console.log('Parsing as PDF file');
        text = await parsePdfFile(file.buffer);
        break;
      case '.docx':
        console.log('Parsing as DOCX file');
        text = await parseDocxFile(file.buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}. Supported types are .txt, .pdf, and .docx`);
    }
  } catch (error) {
    console.error('Error in extractTextFromFile:', error.message);
    // Re-throw parsing errors as-is (they already have good messages)
    throw error;
  }
  
  console.log('Text extracted, validating:', {
    textType: typeof text,
    textLength: text?.length || 0,
    trimmedLength: text?.trim()?.length || 0
  });
  
  // Final validation to ensure we have a valid string
  if (text === undefined || text === null) {
    throw new Error(`File parsing returned null or undefined. The file may be corrupted or unreadable.`);
  }
  
  if (typeof text !== 'string') {
    throw new Error(`File parsing returned invalid data type. Expected string, got ${typeof text}`);
  }
  
  if (text.trim().length === 0) {
    throw new Error('File appears to be empty or contains no readable text.');
  }
  
  console.log('File extraction successful, returning text of length:', text.length);
  return text;
};

// Smart truncation that preserves important parts (beginning and end)
const truncateTranscript = (transcript, maxLength = 8000) => {
  if (transcript.length <= maxLength) {
    return { truncated: false, text: transcript, originalLength: transcript.length };
  }
  
  const originalLength = transcript.length;
  
  // Keep beginning (context) and end (conclusions)
  // For very long transcripts, use more aggressive truncation
  let keepStart, keepEnd;
  if (originalLength > 15000) {
    // Very long: keep 30% start, 30% end
    keepStart = Math.floor(maxLength * 0.3);
    keepEnd = Math.floor(maxLength * 0.3);
  } else {
    // Long: keep 40% start, 40% end
    keepStart = Math.floor(maxLength * 0.4);
    keepEnd = Math.floor(maxLength * 0.4);
  }
  
  const start = transcript.substring(0, keepStart);
  const end = transcript.substring(transcript.length - keepEnd);
  const middle = originalLength - keepStart - keepEnd;
  
  const truncatedText = `${start}\n\n[... ${middle.toLocaleString()} characters of transcript content omitted for processing efficiency ...]\n\n${end}`;
  
  console.log(`Transcript truncated: ${originalLength} -> ${truncatedText.length} chars (kept ${keepStart} start + ${keepEnd} end)`);
  
  return { truncated: true, text: truncatedText, originalLength };
};

// Optimized prompt for Llama 3.2 to return JSON
const createPrompt = (transcript) => {
  return `Analyze this meeting transcript and return ONLY valid JSON (no markdown, no code blocks).

If speaker labels exist (e.g., "Rahul:", "Anita:"), calculate speaker_contributions percentages totaling 100.

JSON structure:
{
  "meeting_title": "Concise title (3-8 words)",
  "summary": "2-3 sentence summary",
  "attendees": ["name1", "name2"],
  "action_items": [{"task": "...", "owner": "...", "deadline": "...", "priority": "High|Medium|Low"}],
  "key_decisions": ["Decision 1"],
  "risks": ["Risk 1"],
  "sentiment": "Positive|Neutral|Negative",
  "speaker_contributions": [{"speaker": "...", "percentage": number}]
}

If no speaker labels, use empty array for speaker_contributions.

Transcript:
${transcript}

Return only JSON:`;
};

// Helper function to extract JSON from model response
const extractJSON = (text) => {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  
  // Remove ```json and ``` markers
  cleaned = cleaned.replace(/```json\s*/g, '');
  cleaned = cleaned.replace(/```\s*/g, '');
  
  // Try to find JSON object boundaries
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // If parsing fails, try to fix common issues
    console.error('JSON parsing error:', error.message);
    throw new Error('Failed to parse AI response as JSON');
  }
};

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum file size is 10MB.' });
    }
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'File upload failed' });
  }
  next();
};

app.post('/analyze', upload.single('file'), handleMulterError, async (req, res) => {
  try {
    let transcript = '';

    // Debug logging
    console.log('Request received:', {
      hasFile: !!req.file,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      fileMimetype: req.file?.mimetype,
      hasBodyTranscript: !!req.body.transcript,
      bodyKeys: Object.keys(req.body || {}),
      contentType: req.headers['content-type']
    });

    // Check if file was uploaded
    if (req.file) {
      try {
        // Validate file object
        if (!req.file.buffer || req.file.buffer.length === 0) {
          console.error('File buffer is missing or empty');
          return res.status(400).json({ error: 'Uploaded file is empty or corrupted. Please try uploading the file again.' });
        }
        
        console.log(`Extracting text from file: ${req.file.originalname}, size: ${req.file.size} bytes`);
        
        // Extract text from file (this function now handles all validation)
        transcript = await extractTextFromFile(req.file);
        
        console.log(`Extracted text length: ${transcript?.length || 0} characters`);
        
        // Additional validation (extractTextFromFile should have already validated, but double-check)
        if (typeof transcript !== 'string') {
          console.error(`Invalid transcript type: ${typeof transcript}`);
          return res.status(400).json({ error: `File parsing error: Expected string but got ${typeof transcript}. Please ensure the file contains readable text.` });
        }
        
        if (!transcript || transcript.trim().length === 0) {
          console.error('Extracted transcript is empty');
          return res.status(400).json({ error: 'The uploaded file appears to be empty or contains no readable text. Please ensure the file contains text content.' });
        }
        
        console.log('File parsed successfully, transcript length:', transcript.length);
      } catch (error) {
        // Return the specific error message from parsing
        console.error('Error extracting text from file:', error.message);
        return res.status(400).json({ error: error.message || 'Failed to process uploaded file. Please ensure the file is a valid PDF, DOCX, or TXT file with readable text.' });
      }
    } else if (req.body.transcript) {
      // Fall back to text input from request body
      transcript = req.body.transcript;
      
      // Validate text input
      if (typeof transcript !== 'string') {
        return res.status(400).json({ error: 'Transcript text must be a string' });
      }
      
      if (transcript.trim().length === 0) {
        return res.status(400).json({ error: 'Transcript text cannot be empty' });
      }
    } else {
      console.error('No file or transcript text provided');
      return res.status(400).json({ error: 'Either a transcript file or transcript text is required' });
    }

    // Final validation check (should not be needed due to earlier checks, but kept as safety net)
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      console.error('Final validation failed:', {
        transcriptExists: !!transcript,
        transcriptType: typeof transcript,
        transcriptLength: transcript?.length || 0
      });
      return res.status(400).json({ error: 'Transcript is required and must be a non-empty string' });
    }

    // Apply intelligent truncation for long transcripts
    const originalLength = transcript.length;
    const truncationResult = truncateTranscript(transcript, 8000);
    transcript = truncationResult.text;
    
    console.log(`Transcript processing: original=${originalLength} chars, final=${transcript.length} chars, truncated=${truncationResult.truncated}`);

    const prompt = createPrompt(transcript);

    // Calculate timeout based on original transcript length (minimum 3 minutes, add 1 minute per 5000 characters)
    const transcriptLength = originalLength;
    const baseTimeout = 180000; // 3 minutes base
    const additionalTimeout = Math.floor(transcriptLength / 5000) * 60000; // 1 minute per 5000 chars
    const calculatedTimeout = Math.min(baseTimeout + additionalTimeout, 600000); // Max 10 minutes
    
    console.log(`Transcript length: ${transcriptLength} chars, using timeout: ${calculatedTimeout}ms (${Math.round(calculatedTimeout / 1000)}s)`);

    // Call Ollama API
    const response = await axios.post(OLLAMA_URL, {
      model: 'llama3.2',
      prompt: prompt,
      stream: false,
      format: 'json' // Request JSON format from Ollama
    }, {
      timeout: calculatedTimeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Extract response text
    let responseText = '';
    if (response.data.response) {
      responseText = response.data.response;
    } else if (typeof response.data === 'string') {
      responseText = response.data;
    } else {
      responseText = JSON.stringify(response.data);
    }

    // Parse JSON from response
    const analysisResult = extractJSON(responseText);

    // Validate required fields
    const requiredFields = ['meeting_title', 'summary', 'attendees', 'action_items', 'key_decisions', 'risks', 'sentiment', 'speaker_contributions'];
    for (const field of requiredFields) {
      if (!(field in analysisResult)) {
        // Set defaults for missing fields
        if (field === 'meeting_title') {
          analysisResult.meeting_title = 'Meeting Summary';
        } else if (field === 'speaker_contributions') {
          analysisResult.speaker_contributions = [];
        } else {
          throw new Error(`Missing required field: ${field}`);
        }
      }
    }

    // Ensure arrays are arrays
    if (!Array.isArray(analysisResult.attendees)) analysisResult.attendees = [];
    if (!Array.isArray(analysisResult.action_items)) analysisResult.action_items = [];
    if (!Array.isArray(analysisResult.key_decisions)) analysisResult.key_decisions = [];
    if (!Array.isArray(analysisResult.risks)) analysisResult.risks = [];
    if (!Array.isArray(analysisResult.speaker_contributions)) analysisResult.speaker_contributions = [];

    // Validate meeting_title
    if (!analysisResult.meeting_title || typeof analysisResult.meeting_title !== 'string') {
      analysisResult.meeting_title = 'Meeting Summary';
    }

    // Validate action items structure
    analysisResult.action_items = analysisResult.action_items.map(item => ({
      task: item.task || 'N/A',
      owner: item.owner || 'Unassigned',
      deadline: item.deadline || 'TBD',
      priority: ['High', 'Medium', 'Low'].includes(item.priority) ? item.priority : 'Medium'
    }));

    // Validate sentiment
    if (!['Positive', 'Neutral', 'Negative'].includes(analysisResult.sentiment)) {
      analysisResult.sentiment = 'Neutral';
    }

    // Validate speaker_contributions structure
    analysisResult.speaker_contributions = analysisResult.speaker_contributions.map(contrib => ({
      speaker: contrib.speaker || 'Unknown',
      percentage: typeof contrib.percentage === 'number' ? Math.round(contrib.percentage) : 0
    }));

    res.json(analysisResult);

  } catch (error) {
    console.error('Error analyzing transcript:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Cannot connect to Ollama. Please ensure Ollama is running on localhost:11434' 
      });
    }
    
    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return res.status(504).json({ 
        error: 'Request timeout. The transcript may be too long or Ollama is taking too long to process. Please try with a shorter transcript or wait a moment and try again.' 
      });
    }
    
    if (error.response) {
      return res.status(500).json({ 
        error: `Ollama API error: ${error.response.data?.error || error.message}` 
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'An error occurred while analyzing the transcript' 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Meeting Summarizer API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Make sure Ollama is running with llama3.2 model available');
});
