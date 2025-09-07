// // /api/ingest_pdf.js
// import { IncomingForm } from 'formidable';
// import fs from 'fs';

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// // Simple PDF text extraction without external libraries
// function extractTextFromPDF(buffer) {
//   const content = buffer.toString('binary');
  
//   // Extract text between stream objects
//   const textMatches = [];
//   const streamPattern = /stream[\s\S]*?endstream/g;
//   const streams = content.match(streamPattern) || [];
  
//   for (const stream of streams) {
//     // Look for text content patterns
//     const textPattern = /\((.*?)\)/g;
//     const matches = stream.match(textPattern) || [];
    
//     for (const match of matches) {
//       // Clean up the text
//       const text = match
//         .slice(1, -1) // Remove parentheses
//         .replace(/\\r/g, '\r')
//         .replace(/\\n/g, '\n')
//         .replace(/\\t/g, '\t')
//         .replace(/\\\(/g, '(')
//         .replace(/\\\)/g, ')')
//         .replace(/\\\\/g, '\\');
      
//       if (text.trim()) {
//         textMatches.push(text);
//       }
//     }
//   }
  
//   // Join and clean up
//   return textMatches
//     .join(' ')
//     .replace(/\s+/g, ' ')
//     .replace(/\n{3,}/g, '\n\n')
//     .trim();
// }

// export default async function handler(req, res) {
//   // Enable CORS
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   if (req.method === 'OPTIONS') {
//     return res.status(200).end();
//   }

//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const form = new IncomingForm({
//     uploadDir: '/tmp',
//     keepExtensions: true,
//     maxFileSize: 10 * 1024 * 1024, // 10MB limit
//   });

//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       console.error('Form parse error:', err);
//       return res.status(500).json({ error: 'Form parse error', detail: err.message });
//     }

//     const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;
//     if (!rawFile || !rawFile.filepath) {
//       return res.status(400).json({ error: 'PDF file is missing' });
//     }

//     try {
//       // Read the PDF file
//       const dataBuffer = fs.readFileSync(rawFile.filepath);
      
//       // Extract text using simple method
//       let extractedText = extractTextFromPDF(dataBuffer);
      
//       // If simple extraction doesn't work well, provide fallback message
//       if (!extractedText || extractedText.length < 100) {
//         extractedText = "PDF content extracted. Note: Some complex PDFs may not extract perfectly. For best results, consider copying the text directly from the PDF.";
//       }
      
//       // Clean up temp file
//       try {
//         fs.unlinkSync(rawFile.filepath);
//       } catch (e) {
//         console.warn('Could not delete temp file:', e);
//       }
      
//       return res.status(200).json({
//         text: extractedText,
//         message: "PDF processed successfully"
//       });
      
//     } catch (error) {
//       console.error('PDF processing error:', error);
      
//       // Return a graceful fallback
//       return res.status(200).json({
//         text: "Unable to extract text from this PDF. Please copy and paste the relevant content manually.",
//         error: true,
//         message: "PDF extraction limited - manual copy recommended"
//       });
//     }
//   });
// }

// api/ingest_pdf.js - Vercel compatible version without pdf-parse
import { IncomingForm } from 'formidable';
import fs from 'fs';
import config from '../lib/config.js';

// Vercel requires this configuration
export const apiConfig = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('📄 /api/ingest_pdf called');
  console.log('Method:', req.method);
  console.log('Origin:', req.headers.origin);
  
  // Enhanced CORS headers for Vercel
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - returning 200');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Create form parser with error handling
  const form = new IncomingForm({
    uploadDir: '/tmp',
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  console.log('📥 Parsing form data...');

  // Parse uploaded file with promise wrapper
  const parseForm = () => {
    return new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('❌ Form parse error:', err);
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    });
  };

  try {
    const { fields, files } = await parseForm();
    
    // Get uploaded PDF file
    const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!rawFile || !rawFile.filepath) {
      console.error('❌ No file uploaded');
      return res.status(400).json({ 
        error: 'No PDF file uploaded',
        detail: 'Please select a PDF file to upload'
      });
    }

    console.log('📁 File received:', {
      name: rawFile.originalFilename,
      size: rawFile.size,
      type: rawFile.mimetype,
      path: rawFile.filepath
    });

    // Read file buffer
    let pdfBuffer;
    try {
      pdfBuffer = fs.readFileSync(rawFile.filepath);
      console.log('✅ File read successfully, size:', pdfBuffer.length);
    } catch (readErr) {
      console.error('❌ Failed to read file:', readErr);
      throw new Error('Failed to read uploaded file');
    }

    // Extract text using fallback method (no external dependencies)
    let extractedText = '';
    
    try {
      console.log('🔍 Extracting text from PDF...');
      extractedText = await extractPdfTextFallback(pdfBuffer);
      
      if (!extractedText || extractedText.trim().length < 10) {
        // Try alternative extraction
        extractedText = extractBasicPdfText(pdfBuffer);
      }
      
      console.log('📝 Extracted text length:', extractedText.length);
      
    } catch (extractErr) {
      console.error('⚠️ Text extraction error:', extractErr);
      extractedText = '';
    }

    // Clean up temp file
    try {
      fs.unlinkSync(rawFile.filepath);
      console.log('🗑️ Temp file cleaned');
    } catch (cleanErr) {
      console.warn('Could not clean temp file:', cleanErr.message);
    }

    // Check if extraction was successful
    if (!extractedText || extractedText.trim().length < 10) {
      console.warn('⚠️ No meaningful text extracted');
      return res.status(200).json({
        success: false,
        text: '',
        message: 'Could not extract text from PDF. The file might be image-based, encrypted, or in an unsupported format.',
        hint: 'Please try: 1) Using a different PDF, 2) Copying text manually, or 3) Using OCR software for scanned documents',
        metadata: {
          filename: rawFile.originalFilename,
          size: rawFile.size
        }
      });
    }

    // Return successful extraction
    return res.status(200).json({
      success: true,
      text: extractedText,
      message: 'PDF processed successfully',
      metadata: {
        filename: rawFile.originalFilename,
        size: rawFile.size,
        text_length: extractedText.length,
        processed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Processing error:', error);
    console.error('Error stack:', error.stack);
    
    // Try to clean up temp file if it exists
    try {
      if (files?.file) {
        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        if (file?.filepath) {
          fs.unlinkSync(file.filepath);
        }
      }
    } catch (cleanErr) {
      // Ignore cleanup errors
    }
    
    return res.status(500).json({
      error: 'PDF processing failed',
      detail: config.isDevelopment ? error.message : 'Unable to process PDF',
      hint: 'Please ensure the file is a valid PDF'
    });
  }
}

/**
 * Fallback PDF text extraction without external libraries
 */
async function extractPdfTextFallback(buffer) {
  try {
    // Convert buffer to string
    const pdfString = buffer.toString('binary');
    let extractedText = '';
    
    // Method 1: Extract text between BT and ET markers
    const btEtPattern = /BT\s*(.*?)\s*ET/gs;
    let match;
    
    while ((match = btEtPattern.exec(pdfString)) !== null) {
      const content = match[1];
      
      // Extract text in parentheses (Tj operator)
      const tjPattern = /\(((?:[^()\\]|\\[\\()])*)\)\s*Tj/g;
      let tjMatch;
      
      while ((tjMatch = tjPattern.exec(content)) !== null) {
        let text = tjMatch[1];
        
        // Decode escape sequences
        text = text
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\b/g, '\b')
          .replace(/\\f/g, '\f')
          .replace(/\\(/g, '(')
          .replace(/\\)/g, ')')
          .replace(/\\\\/g, '\\')
          .replace(/\\([0-9]{3})/g, (match, octal) => 
            String.fromCharCode(parseInt(octal, 8))
          );
        
        extractedText += text + ' ';
      }
      
      // Also try TJ operator (array of strings)
      const tjArrayPattern = /\[(.*?)\]\s*TJ/g;
      while ((tjMatch = tjArrayPattern.exec(content)) !== null) {
        const arrayContent = tjMatch[1];
        const stringPattern = /\(((?:[^()\\]|\\[\\()])*)\)/g;
        let stringMatch;
        
        while ((stringMatch = stringPattern.exec(arrayContent)) !== null) {
          let text = stringMatch[1];
          text = text.replace(/\\([0-9]{3})/g, (match, octal) => 
            String.fromCharCode(parseInt(octal, 8))
          );
          extractedText += text;
        }
      }
    }
    
    // Method 2: Extract from stream objects
    if (extractedText.length < 50) {
      const streamPattern = /stream\s*([\s\S]*?)\s*endstream/g;
      
      while ((match = streamPattern.exec(pdfString)) !== null) {
        const streamContent = match[1];
        
        // Look for readable text
        const readable = streamContent
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (readable.length > 20 && !readable.includes('endobj')) {
          extractedText += readable + '\n';
        }
      }
    }
    
    // Clean extracted text
    return cleanExtractedText(extractedText);
    
  } catch (err) {
    console.error('Fallback extraction error:', err);
    return '';
  }
}

/**
 * Basic PDF text extraction (simplified)
 */
function extractBasicPdfText(buffer) {
  try {
    const text = buffer.toString('utf8');
    let extracted = '';
    
    // Extract text between parentheses
    const parenPattern = /\(((?:[^()\\]|\\[\\()])*)\)/g;
    let match;
    
    while ((match = parenPattern.exec(text)) !== null) {
      const content = match[1]
        .replace(/\\/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim();
      
      if (content.length > 3) {
        extracted += content + ' ';
      }
    }
    
    return cleanExtractedText(extracted);
    
  } catch (err) {
    console.error('Basic extraction error:', err);
    return '';
  }
}

/**
 * Clean extracted text
 */
function cleanExtractedText(text) {
  if (!text) return '';
  
  return text
    // Remove null bytes and control characters
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    // Remove common PDF artifacts
    .replace(/\f/g, '\n')
    .replace(/\u00A0/g, ' ')
    // Fix common encoding issues
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€"/g, '—')
    .replace(/â€"/g, '-')
    // Trim
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim();
}