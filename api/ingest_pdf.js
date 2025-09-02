// /api/ingest_pdf.js
import { IncomingForm } from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
      
      // Parse PDF to extract text
      const data = await pdf(dataBuffer);
      
      // Clean up the text
      const cleanedText = data.text
        .replace(/\n{3,}/g, '\n\n')  // Remove excessive newlines
        .replace(/\s+/g, ' ')         // Normalize whitespace
        .trim();
      
      // Clean up temp file
      try {
        fs.unlinkSync(rawFile.filepath);
      } catch (e) {
        console.warn('Could not delete temp file:', e);
      }
      
      return res.status(200).json({
        text: cleanedText,
        pages: data.numpages,
        info: data.info
      });
      
    } catch (error) {
      console.error('PDF processing error:', error);
      return res.status(500).json({
        error: 'PDF processing failed',
        detail: error.message
      });
    }
  });
}