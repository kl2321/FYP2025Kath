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

// api/ingest_pdf.js - Fixed version with proper PDF text extraction
import { IncomingForm } from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';
import config from '../lib/config.js';

export const apiConfig = {
  api: {
    bodyParser: false, // Disable for file uploads
  },
};

export default async function handler(req, res) {
  console.log('📄 /api/ingest_pdf called');
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Create form parser
  const form = new IncomingForm({
    uploadDir: '/tmp',
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB limit
  });

  // Parse the uploaded file
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parse error:', err);
      return res.status(500).json({ 
        error: 'Form parse error', 
        detail: err.message 
      });
    }

    // Get the uploaded PDF file
    const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!rawFile || !rawFile.filepath) {
      return res.status(400).json({ error: 'PDF file is missing' });
    }

    console.log('📁 PDF file received:', {
      name: rawFile.originalFilename,
      size: rawFile.size,
      type: rawFile.mimetype
    });

    try {
      // Read the PDF file buffer
      const pdfBuffer = fs.readFileSync(rawFile.filepath);
      
      // Use pdf-parse to extract text properly
      console.log('🔍 Extracting text from PDF...');
      
      let extractedText = '';
      let metadata = {};
      
      try {
        // Parse PDF with pdf-parse library
        const pdfData = await pdf(pdfBuffer, {
          // Options for better text extraction
          max: 0, // Parse all pages (0 = no limit)
          version: 'v2.0.550'
        });
        
        // Extract clean text
        extractedText = pdfData.text || '';
        
        // Get metadata
        metadata = {
          pages: pdfData.numpages,
          info: pdfData.info,
          version: pdfData.version
        };
        
        console.log('✅ PDF parsed successfully');
        console.log(`📊 Extracted ${extractedText.length} characters from ${pdfData.numpages} pages`);
        
        // Clean and normalize the extracted text
        extractedText = cleanPdfText(extractedText);
        
      } catch (parseErr) {
        console.error('⚠️ PDF parsing error:', parseErr);
        
        // Fallback: Try basic text extraction
        extractedText = await fallbackTextExtraction(pdfBuffer);
      }
      
      // Clean up temp file
      try {
        fs.unlinkSync(rawFile.filepath);
        console.log('🗑️ Temp file cleaned');
      } catch (cleanupErr) {
        console.warn('Could not clean temp file:', cleanupErr.message);
      }
      
      // Check if we got meaningful text
      if (!extractedText || extractedText.trim().length < 10) {
        return res.status(200).json({
          text: '',
          message: 'Could not extract text from PDF. The file might be image-based or encrypted.',
          error: true,
          hint: 'For image-based PDFs, please use OCR software first or copy the text manually.'
        });
      }
      
      // Return extracted text
      return res.status(200).json({
        success: true,
        text: extractedText,
        message: 'PDF processed successfully',
        metadata: {
          filename: rawFile.originalFilename,
          size: rawFile.size,
          text_length: extractedText.length,
          pages: metadata.pages || 'unknown',
          processed_at: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ PDF processing error:', error);
      
      // Clean up temp file on error
      try {
        fs.unlinkSync(rawFile.filepath);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      return res.status(500).json({
        error: 'PDF processing failed',
        detail: config.isDevelopment ? error.message : 'Unable to process PDF file',
        hint: 'Please ensure the file is a valid PDF and not corrupted'
      });
    }
  });
}

// Clean and normalize PDF text
function cleanPdfText(text) {
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
    .replace(/\f/g, '\n') // Form feed to newline
    .replace(/\u00A0/g, ' ') // Non-breaking space to regular space
    .replace(/\u2019/g, "'") // Smart quotes
    .replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u2013/g, '-') // En dash
    .replace(/\u2014/g, '--') // Em dash
    .replace(/\u2026/g, '...') // Ellipsis
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

// Fallback text extraction method
async function fallbackTextExtraction(buffer) {
  console.log('⚠️ Using fallback text extraction method...');
  
  try {
    // Convert buffer to string
    const str = buffer.toString('utf8');
    
    // Look for text between stream markers
    const streamPattern = /stream([\s\S]*?)endstream/g;
    let text = '';
    let match;
    
    while ((match = streamPattern.exec(str)) !== null) {
      // Extract readable characters
      const content = match[1]
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (content.length > 10) {
        text += content + '\n';
      }
    }
    
    // Also try to extract text in parentheses (common in PDFs)
    const parenPattern = /\(((?:[^()\\]|\\[\\()])*)\)/g;
    while ((match = parenPattern.exec(str)) !== null) {
      const content = match[1]
        .replace(/\\/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim();
      
      if (content.length > 5) {
        text += content + ' ';
      }
    }
    
    return cleanPdfText(text);
    
  } catch (err) {
    console.error('❌ Fallback extraction failed:', err);
    return '';
  }
}