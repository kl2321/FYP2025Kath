// api/save_pdf.js - Fixed version with ES modules and better error handling
import config from '../lib/config.js';

export default async function handler(req, res) {
  console.log('📄 /api/save_pdf called');
  console.log('Method:', req.method);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Parse request body
    const body = await getJsonBody(req);
    console.log('Request body keys:', Object.keys(body));
    
    const { session_id, pdf_text, filename } = body;

    // Validate required fields
    if (!session_id) {
      console.error('❌ Missing session_id');
      return res.status(400).json({ 
        error: 'Missing session_id',
        hint: 'Please provide a session_id in the request body' 
      });
    }
    
    if (!pdf_text) {
      console.error('❌ Missing pdf_text');
      return res.status(400).json({ 
        error: 'Missing pdf_text',
        hint: 'Please provide pdf_text in the request body' 
      });
    }

    // Validate Supabase configuration
    if (!config.supabase.url || !config.supabase.anonKey) {
      console.error('❌ Supabase not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        detail: 'Supabase credentials not configured' 
      });
    }

    // Clean PDF text - remove null characters and control characters
    const cleanPdfText = pdf_text
      .replace(/\u0000/g, '') // Remove null characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .trim();

    console.log('📤 Saving to Supabase...');
    console.log('Session ID:', session_id);
    console.log('PDF text length:', cleanPdfText.length);
    console.log('Filename:', filename || 'unknown.pdf');

    // Prepare request to Supabase
    const supabaseUrl = `${config.supabase.url}/rest/v1/pdf_context`;
    const requestBody = JSON.stringify({ 
      session_id, 
      pdf_text: cleanPdfText, 
      filename: filename || 'unknown.pdf',
      created_at: new Date().toISOString()
    });

    console.log('Supabase URL:', supabaseUrl);
    
    // Send to Supabase
    const supabaseRes = await fetch(supabaseUrl, {
      method: 'POST',
      headers: {
        'apikey': config.supabase.anonKey,
        'Authorization': `Bearer ${config.supabase.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation' // Return the created record
      },
      body: requestBody
    });

    console.log('Supabase response status:', supabaseRes.status);
    
    // Handle Supabase response
    if (!supabaseRes.ok) {
      const errorText = await supabaseRes.text();
      console.error('❌ Supabase error:', errorText);
      
      // Parse error if possible
      let errorDetail;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.message || errorJson.error || errorText;
      } catch (e) {
        errorDetail = errorText;
      }
      
      return res.status(500).json({ 
        error: 'PDF save failed', 
        detail: errorDetail,
        hint: 'Check if the pdf_context table exists in Supabase'
      });
    }

    // Parse successful response
    let savedRecord;
    try {
      const responseText = await supabaseRes.text();
      if (responseText) {
        savedRecord = JSON.parse(responseText);
        console.log('✅ PDF saved successfully:', savedRecord);
      }
    } catch (e) {
      console.log('✅ PDF saved (no response body)');
    }

    // Return success
    return res.status(200).json({ 
      ok: true,
      message: 'PDF saved successfully',
      session_id: session_id,
      text_length: cleanPdfText.length,
      saved_record: savedRecord
    });
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      detail: config.isDevelopment ? err.message : undefined 
    });
  }
}

// Helper function to parse JSON body
async function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    
    req.on('data', chunk => {
      raw += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        if (!raw) {
          resolve({});
        } else {
          resolve(JSON.parse(raw));
        }
      } catch (err) {
        console.error('JSON parse error:', err);
        reject(new Error('Invalid JSON in request body'));
      }
    });
    
    req.on('error', (err) => {
      reject(err);
    });
  });
}

// // api/save_pdf.js
// const config = require('../lib/config');
// export default async function handler(req, res) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   if (req.method === 'OPTIONS') return res.status(200).end();
//   if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

//   try {
//     const body = await getJsonBody(req);
//     const { session_id, pdf_text, filename } = body;

//     if (!session_id || !pdf_text) {
//       return res.status(400).json({ error: 'Missing session_id or pdf_text' });
//     }

//     // 🆕 清理PDF文本，移除null字符和其他问题字符
// const cleanPdfText = pdf_text
//   .replace(/\u0000/g, '') // 移除null字符
//   .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 移除控制字符
//   .trim();

// console.log('📤 发送到Supabase...');

    

//     const supabaseRes = await fetch(`${config.supabase.url}/rest/v1/pdf_context`, {
//       method: "POST",
//       headers: {
//         apikey: config.supabase.anonKey,
//         Authorization: `Bearer ${config.supabase.anonKey}`,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({ 
//         session_id, 
//         pdf_text: cleanPdfText, 
//         filename: filename || 'unknown.pdf' 
//       })
//     });

//     if (!supabaseRes.ok) {
//       const errorText = await supabaseRes.text();
//       return res.status(500).json({ error: 'PDF save failed', detail: errorText });
//     }

//     return res.status(200).json({ ok: true });
//   } catch (err) {
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// }

// async function getJsonBody(req) {
//   return new Promise((resolve, reject) => {
//     let raw = '';
//     req.on('data', chunk => raw += chunk);
//     req.on('end', () => {
//       try { resolve(JSON.parse(raw)); } 
//       catch (err) { reject(err); }
//     });
//   });
// }