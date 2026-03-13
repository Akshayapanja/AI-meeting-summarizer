import axios from 'axios';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import Busboy from 'busboy';

// Get Ollama URL from environment variable (defaults to localhost for local dev)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';

// File parsing functions (same as backend)
const parseTextFile = async (buffer) => {
  try {
    const text = buffer.toString('utf-8');
    
    if (text.trim().length === 0) {
      throw new Error('Text file appears to be empty.');
    }
    
    return text;
  } catch (error) {
    if (error.message.includes('empty')) {
      throw error;
    }
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
    
    if (!data) {
      console.error('PDF parsing returned no data object');
      throw new Error('PDF parsing returned no data');
    }
    
    if (data.text === undefined || data.text === null) {
      console.error('PDF text property is undefined or null');
      throw new Error('PDF does not contain extractable text. The PDF may be image-based (scanned) or corrupted. Please ensure the PDF contains selectable text.');
    }
    
    const text = typeof data.text === 'string' ? data.text : String(data.text || '');
    
    console.log('PDF text extracted, length:', text.length, 'trimmed length:', text.trim().length);
    
    if (text.trim().length === 0) {
      console.error('PDF text is empty after trimming');
      throw new Error('PDF appears to be empty or contains no readable text. Please ensure the PDF contains text content.');
    }
    
    return text;
  } catch (error) {
    console.error('PDF parsing error:', error.message);
    if (error.message.includes('PDF') || error.message.includes('extractable') || error.message.includes('empty')) {
      throw error;
    }
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

const parseDocxFile = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    
    if (!result) {
      throw new Error('DOCX parsing returned no data');
    }
    
    if (result.value === undefined || result.value === null) {
      throw new Error('DOCX file does not contain extractable text or is corrupted.');
    }
    
    const text = typeof result.value === 'string' ? result.value : String(result.value || '');
    
    if (text.trim().length === 0) {
      throw new Error('DOCX file appears to be empty or contains no readable text.');
    }
    
    return text;
  } catch (error) {
    if (error.message.includes('DOCX') || error.message.includes('extractable') || error.message.includes('empty')) {
      throw error;
    }
    throw new Error(`Failed to parse DOCX: ${error.message}`);
  }
};

const extractTextFromFile = async (fileBuffer, fileName) => {
  console.log('extractTextFromFile called with:', {
    hasBuffer: !!fileBuffer,
    bufferLength: fileBuffer?.length || 0,
    fileName: fileName
  });
  
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('Invalid file: file buffer is missing or invalid');
  }
  
  if (fileBuffer.length === 0) {
    throw new Error('Invalid file: file buffer is empty');
  }
  
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  console.log('File extension:', ext);
  
  let text;
  try {
    switch (ext) {
      case '.txt':
        console.log('Parsing as text file');
        text = await parseTextFile(fileBuffer);
        break;
      case '.pdf':
        console.log('Parsing as PDF file');
        text = await parsePdfFile(fileBuffer);
        break;
      case '.docx':
        console.log('Parsing as DOCX file');
        text = await parseDocxFile(fileBuffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}. Supported types are .txt, .pdf, and .docx`);
    }
  } catch (error) {
    console.error('Error in extractTextFromFile:', error.message);
    throw error;
  }
  
  console.log('Text extracted, validating:', {
    textType: typeof text,
    textLength: text?.length || 0,
    trimmedLength: text?.trim()?.length || 0
  });
  
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

const truncateTranscript = (transcript, maxLength = 8000) => {
  if (transcript.length <= maxLength) {
    return { truncated: false, text: transcript, originalLength: transcript.length };
  }
  
  const originalLength = transcript.length;
  
  let keepStart, keepEnd;
  if (originalLength > 15000) {
    keepStart = Math.floor(maxLength * 0.3);
    keepEnd = Math.floor(maxLength * 0.3);
  } else {
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

const extractJSON = (text) => {
  let cleaned = text.trim();
  
  cleaned = cleaned.replace(/```json\s*/g, '');
  cleaned = cleaned.replace(/```\s*/g, '');
  
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parsing error:', error.message);
    throw new Error('Failed to parse AI response as JSON');
  }
};

// Parse multipart form data using busboy (for Vercel serverless functions)
// Vercel serverless functions require piping req directly to busboy
const parseMultipartFormData = async (req) => {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      wrappedReject(new Error('Content-Type must be multipart/form-data'));
      return;
    }
    
    let fileBuffer = null;
    let fileName = null;
    let transcript = '';
    let hasError = false;
    let fileProcessed = false;
    let busboyFinished = false;
    
    // Wrap resolve and reject to handle timeout cleanup
    let timeoutId = null;
    const wrappedResolve = (value) => {
      if (timeoutId) clearTimeout(timeoutId);
      resolve(value);
    };
    const wrappedReject = (error) => {
      if (timeoutId) clearTimeout(timeoutId);
      reject(error);
    };
    
    // Add timeout to prevent hanging
    timeoutId = setTimeout(() => {
      if (!busboyFinished && !hasError) {
        hasError = true;
        wrappedReject(new Error('Request timeout: Multipart parsing took too long'));
      }
    }, 30000); // 30 second timeout
    
    // Create busboy instance
    const busboy = Busboy({ headers: req.headers });
    
    // Handle file field
    busboy.on('file', (fieldname, file, info) => {
      const { filename } = info;
      
      if (fieldname === 'file') {
        fileName = filename;
        const chunks = [];
        
        file.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        file.on('end', () => {
          fileBuffer = Buffer.concat(chunks);
          fileProcessed = true;
          console.log(`File received: ${filename}, size: ${fileBuffer.length} bytes`);
          // Don't resolve here - wait for busboy finish event
        });
        
        file.on('error', (err) => {
          console.error('File stream error:', err);
          if (!hasError) {
            hasError = true;
            wrappedReject(new Error(`File upload error: ${err.message}`));
          }
        });
      } else {
        // Ignore other file fields
        file.resume();
      }
    });
    
    // Handle text fields
    busboy.on('field', (fieldname, value) => {
      if (fieldname === 'transcript') {
        transcript = value;
        console.log('Transcript field received, length:', value.length);
      }
    });
    
    // Handle finish event - this fires when busboy finishes parsing all data
    busboy.on('finish', () => {
      console.log('Busboy finish event triggered');
      busboyFinished = true;
      
      if (!hasError) {
        console.log('Busboy parsing complete:', {
          hasFile: !!fileBuffer,
          fileName,
          fileSize: fileBuffer?.length || 0,
          transcriptLength: transcript.length
        });
        
        wrappedResolve({
          file: fileBuffer ? { buffer: fileBuffer, originalname: fileName } : null,
          transcript: transcript || ''
        });
      }
    });
    
    // Handle errors
    busboy.on('error', (err) => {
      console.error('Busboy error:', err);
      if (!hasError) {
        hasError = true;
        wrappedReject(new Error(`Failed to parse multipart form data: ${err.message}`));
      }
    });
    
    // Pipe request directly to busboy (Vercel serverless functions support this)
    try {
      console.log('Setting up busboy parser, req.body type:', typeof req.body);
      console.log('req.pipe available:', typeof req.pipe === 'function');
      console.log('req.on available:', typeof req.on === 'function');
      
      // In Vercel, req should be a readable stream that can be piped directly to busboy
      if (req.pipe && typeof req.pipe === 'function') {
        console.log('Piping req directly to busboy');
        req.pipe(busboy);
      } else if (Buffer.isBuffer(req.body)) {
        // Fallback: if body is already a buffer
        console.log('Using req.body as Buffer, length:', req.body.length);
        busboy.end(req.body);
      } else if (typeof req.body === 'string') {
        // Fallback: if body is a string
        console.log('Using req.body as String, converting to Buffer');
        busboy.end(Buffer.from(req.body, 'binary'));
      } else if (req.on && typeof req.on === 'function') {
        // Try to read from request stream
        console.log('Reading from request stream');
        const chunks = [];
        req.on('data', (chunk) => {
          chunks.push(chunk);
        });
        req.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log('Collected buffer from stream, length:', buffer.length);
          busboy.end(buffer);
        });
        req.on('error', (err) => {
          console.error('Request stream error:', err);
          if (!hasError) {
            hasError = true;
            wrappedReject(new Error(`Error reading request stream: ${err.message}`));
          }
        });
      } else {
        // Last resort: try to use req.body even if it's an object
        console.log('Attempting to use req.body as-is, type:', typeof req.body);
        if (req.body) {
          try {
            const bodyStr = JSON.stringify(req.body);
            wrappedReject(new Error('Request body appears to be parsed JSON. For file uploads, ensure Content-Type is multipart/form-data and body is not pre-parsed.'));
          } catch (e) {
            wrappedReject(new Error(`Unable to process request body. Type: ${typeof req.body}. Vercel may not be providing the raw request body.`));
          }
        } else {
          wrappedReject(new Error('Request body is not available. This may be a Vercel configuration issue.'));
        }
      }
    } catch (error) {
      console.error('Error setting up request pipe:', error);
      console.error('Error stack:', error.stack);
      if (!hasError) {
        hasError = true;
        wrappedReject(new Error(`Error processing request: ${error.message}`));
      }
    }
  });
};

export default async function handler(req, res) {
  // Set CORS headers for file uploads
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Content-Disposition');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    let transcript = '';
    let fileData = null;
    
    // Check content type
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Parse multipart form data
      try {
        console.log('Attempting to parse multipart form data...');
        console.log('Request body type:', typeof req.body);
        console.log('Request body is buffer:', Buffer.isBuffer(req.body));
        console.log('Request body length:', req.body?.length || 'N/A');
        
        const parsed = await parseMultipartFormData(req);
        fileData = parsed.file;
        transcript = parsed.transcript || '';
        
        console.log('Multipart parsing successful:', {
          hasFile: !!fileData,
          fileName: fileData?.originalname,
          fileSize: fileData?.buffer?.length,
          transcriptLength: transcript.length
        });
      } catch (error) {
        console.error('Error parsing multipart form data:', error);
        console.error('Error stack:', error.stack);
        return res.status(400).json({ 
          error: `Failed to parse form data: ${error.message}`,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    } else if (contentType.includes('application/json')) {
      // Parse JSON body
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        transcript = body.transcript || '';
      } catch (error) {
        console.error('Error parsing JSON body:', error);
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
    } else {
      return res.status(400).json({ error: 'Unsupported content type. Use multipart/form-data for file uploads or application/json for text.' });
    }
    
    // Debug logging
    console.log('Request received:', {
      hasFile: !!fileData,
      fileName: fileData?.originalname,
      fileSize: fileData?.buffer?.length,
      hasBodyTranscript: !!transcript,
      contentType: contentType
    });
    
    // Check if file was uploaded
    if (fileData) {
      try {
        // Validate file object
        if (!fileData.buffer || fileData.buffer.length === 0) {
          console.error('File buffer is missing or empty');
          return res.status(400).json({ error: 'Uploaded file is empty or corrupted. Please try uploading the file again.' });
        }
        
        // Check file size (10MB limit)
        if (fileData.buffer.length > 10 * 1024 * 1024) {
          return res.status(400).json({ error: 'File too large. Maximum file size is 10MB.' });
        }
        
        // Validate file type
        const ext = fileData.originalname.toLowerCase().substring(fileData.originalname.lastIndexOf('.'));
        const allowedTypes = ['.txt', '.pdf', '.docx'];
        if (!allowedTypes.includes(ext)) {
          return res.status(400).json({ error: 'Invalid file type. Only .txt, .pdf, and .docx files are allowed.' });
        }
        
        console.log(`Extracting text from file: ${fileData.originalname}, size: ${fileData.buffer.length} bytes`);
        
        // Extract text from file
        transcript = await extractTextFromFile(fileData.buffer, fileData.originalname);
        
        console.log(`Extracted text length: ${transcript?.length || 0} characters`);
        
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
        console.error('Error extracting text from file:', error.message);
        return res.status(400).json({ error: error.message || 'Failed to process uploaded file. Please ensure the file is a valid PDF, DOCX, or TXT file with readable text.' });
      }
    } else if (transcript) {
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
    
    // Final validation
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      console.error('Final validation failed:', {
        transcriptExists: !!transcript,
        transcriptType: typeof transcript,
        transcriptLength: transcript?.length || 0
      });
      return res.status(400).json({ error: 'Transcript is required and must be a non-empty string' });
    }
    
    // Apply intelligent truncation
    const originalLength = transcript.length;
    const truncationResult = truncateTranscript(transcript, 8000);
    transcript = truncationResult.text;
    
    console.log(`Transcript processing: original=${originalLength} chars, final=${transcript.length} chars, truncated=${truncationResult.truncated}`);
    
    const prompt = createPrompt(transcript);
    
    // Calculate timeout
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
      format: 'json'
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
    
    return res.status(200).json(analysisResult);
    
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Cannot connect to Ollama. Please ensure Ollama is running and OLLAMA_URL environment variable is set correctly.' 
      });
    }
    
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
    
    return res.status(500).json({ 
      error: error.message || 'An error occurred while analyzing the transcript' 
    });
  }
}
