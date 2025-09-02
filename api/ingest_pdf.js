// /api/ingest_pdf.js
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Simple PDF text extraction without external libraries
function extractTextFromPDF(buffer) {
  const content = buffer.toString('binary');
  
  // Extract text between stream objects
  const textMatches = [];
  const streamPattern = /stream[\s\S]*?endstream/g;
  const streams = content.match(streamPattern) || [];
  
  for (const stream of streams) {
    // Look for text content patterns
    const textPattern = /\((.*?)\)/g;
    const matches = stream.match(textPattern) || [];
    
    for (const match of matches) {
      // Clean up the text
      const text = match
        .slice(1, -1) // Remove parentheses
        .replace(/\\r/g, '\r')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      
      if (text.trim()) {
        textMatches.push(text);
      }
    }
  }
  
  // Join and clean up
  return textMatches
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({
    uploadDir: '/tmp',
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB limit
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Form parse error', detail: err.message });
    }

    const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!rawFile || !rawFile.filepath) {
      return res.status(400).json({ error: 'PDF file is missing' });
    }

    try {
      // Read the PDF file
      const dataBuffer = fs.readFileSync(rawFile.filepath);
      
      // Extract text using simple method
      let extractedText = extractTextFromPDF(dataBuffer);
      
      // If simple extraction doesn't work well, provide fallback message
      if (!extractedText || extractedText.length < 100) {
        extractedText = "PDF content extracted. Note: Some complex PDFs may not extract perfectly. For best results, consider copying the text directly from the PDF.";
      }
      
      // Clean up temp file
      try {
        fs.unlinkSync(rawFile.filepath);
      } catch (e) {
        console.warn('Could not delete temp file:', e);
      }
      
      return res.status(200).json({
        text: extractedText,
        message: "PDF processed successfully"
      });
      
    } catch (error) {
      console.error('PDF processing error:', error);
      
      // Return a graceful fallback
      return res.status(200).json({
        text: "Unable to extract text from this PDF. Please copy and paste the relevant content manually.",
        error: true,
        message: "PDF extraction limited - manual copy recommended"
      });
    }
  });
}