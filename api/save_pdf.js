// api/save_pdf.js - Optimized version with proper text encoding handling
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

    // Clean and process PDF text
    const cleanedText = cleanAndProcessPdfText(pdf_text);
    
    // Validate cleaned text
    if (!cleanedText || cleanedText.trim().length === 0) {
      console.warn('⚠️ PDF text is empty after cleaning');
      return res.status(400).json({
        error: 'Invalid PDF text',
        detail: 'PDF text is empty or contains only invalid characters'
      });
    }

    console.log('📊 PDF Processing Stats:');
    console.log('  Original length:', pdf_text.length);
    console.log('  Cleaned length:', cleanedText.length);
    console.log('  Session ID:', session_id);
    console.log('  Filename:', filename || 'unknown.pdf');

    // Prepare Supabase request
    const supabaseUrl = `${config.supabase.url}/rest/v1/pdf_context`;
    
    // Create request body with cleaned text
    const requestBody = {
      session_id: session_id.trim(),
      pdf_text: cleanedText,
      filename: sanitizeFilename(filename),
      created_at: new Date().toISOString(),
      // Add metadata
      metadata: JSON.stringify({
        original_length: pdf_text.length,
        cleaned_length: cleanedText.length,
        processing_date: new Date().toISOString(),
        encoding: 'UTF-8'
      })
    };

    console.log('📤 Sending to Supabase...');
    console.log('  URL:', supabaseUrl);
    console.log('  Text preview:', cleanedText.substring(0, 100) + '...');
    
    // Send to Supabase
    const supabaseRes = await fetch(supabaseUrl, {
      method: 'POST',
      headers: {
        'apikey': config.supabase.anonKey,
        'Authorization': `Bearer ${config.supabase.anonKey}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Supabase response status:', supabaseRes.status);
    
    // Handle Supabase response
    if (!supabaseRes.ok) {
      const errorText = await supabaseRes.text();
      console.error('❌ Supabase error:', errorText);
      
      // Parse error for better reporting
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
        hint: 'Check if the pdf_context table exists and has the correct schema'
      });
    }

    // Parse successful response
    let savedRecord;
    try {
      const responseText = await supabaseRes.text();
      if (responseText) {
        savedRecord = JSON.parse(responseText);
        console.log('✅ PDF saved successfully');
        console.log('  Record ID:', Array.isArray(savedRecord) ? savedRecord[0]?.id : savedRecord?.id);
      }
    } catch (e) {
      console.log('✅ PDF saved (no response body)');
    }

    // Return success response
    return res.status(200).json({ 
      ok: true,
      message: 'PDF saved successfully',
      session_id: session_id,
      stats: {
        original_length: pdf_text.length,
        cleaned_length: cleanedText.length,
        compression_ratio: ((1 - cleanedText.length / pdf_text.length) * 100).toFixed(2) + '%'
      },
      saved_record: savedRecord
    });
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      detail: config.isDevelopment ? err.message : 'An unexpected error occurred',
      stack: config.isDevelopment ? err.stack : undefined
    });
  }
}

/**
 * Clean and process PDF text to remove invalid characters and normalize encoding
 */
function cleanAndProcessPdfText(text) {
  if (!text) return '';
  
  // Convert to string if needed
  if (typeof text !== 'string') {
    text = String(text);
  }
  
  // Step 1: Remove null bytes and control characters
  let cleaned = text
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control chars except \t, \n, \r
    .replace(/[\x7F-\x9F]/g, ''); // Remove extended control chars
  
  // Step 2: Fix common PDF encoding issues
  cleaned = cleaned
    // Fix Windows-1252 encoded characters that appear as UTF-8
    .replace(/â€™/g, "'")  // Right single quote
    .replace(/â€œ/g, '"')  // Left double quote
    .replace(/â€/g, '"')   // Right double quote
    .replace(/â€"/g, '—')  // Em dash
    .replace(/â€"/g, '–')  // En dash
    .replace(/â€¦/g, '...')  // Ellipsis
    .replace(/Ã¢/g, 'â')   // Circumflex a
    .replace(/Ã©/g, 'é')   // Acute e
    .replace(/Ã¨/g, 'è')   // Grave e
    .replace(/Ã /g, 'à')   // Grave a
    .replace(/Ã§/g, 'ç')   // Cedilla c
    .replace(/Ã´/g, 'ô')   // Circumflex o
    .replace(/Ã®/g, 'î')   // Circumflex i
    
    // Fix Unicode characters
    .replace(/\u2019/g, "'")  // Right single quotation mark
    .replace(/\u2018/g, "'")  // Left single quotation mark
    .replace(/\u201C/g, '"')  // Left double quotation mark
    .replace(/\u201D/g, '"')  // Right double quotation mark
    .replace(/\u2013/g, '-')  // En dash
    .replace(/\u2014/g, '--') // Em dash
    .replace(/\u2026/g, '...') // Horizontal ellipsis
    .replace(/\u00A0/g, ' ')  // Non-breaking space
    .replace(/\uFEFF/g, '')   // Zero width no-break space (BOM)
    
    // Fix ligatures
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl')
    .replace(/ﬀ/g, 'ff')
    .replace(/ﬃ/g, 'ffi')
    .replace(/ﬄ/g, 'ffl');
  
  // Step 3: Normalize whitespace
  cleaned = cleaned
    .replace(/\r\n/g, '\n')  // Windows line endings to Unix
    .replace(/\r/g, '\n')    // Mac line endings to Unix
    .replace(/\t/g, '    ')  // Tabs to spaces
    .replace(/\f/g, '\n\n')  // Form feed to double newline
    .replace(/ +/g, ' ')     // Multiple spaces to single
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines to double
    .replace(/^\s+|\s+$/g, ''); // Trim start and end
  
  // Step 4: Remove any remaining non-printable characters
  // Keep only printable ASCII and common Unicode
  cleaned = cleaned.replace(/[^\x20-\x7E\u00A0-\uFFFF\n]/g, ' ');
  
  // Step 5: Final validation - ensure we have valid UTF-8
  try {
    // Encode and decode to ensure valid UTF-8
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const encoded = encoder.encode(cleaned);
    cleaned = decoder.decode(encoded);
  } catch (e) {
    console.warn('⚠️ UTF-8 validation warning:', e.message);
  }
  
  // Step 6: Trim lines and remove empty lines
  cleaned = cleaned
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  
  return cleaned;
}

/**
 * Sanitize filename to prevent injection attacks
 */
function sanitizeFilename(filename) {
  if (!filename) return 'unknown.pdf';
  
  return filename
    .replace(/[^a-zA-Z0-9.\-_ ]/g, '') // Keep only safe characters
    .replace(/\.{2,}/g, '.')           // Remove multiple dots
    .substring(0, 255);                // Limit length
}

/**
 * Helper function to parse JSON body safely
 */
async function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    
    req.on('data', chunk => {
      raw += chunk.toString('utf8'); // Explicitly use UTF-8
    });
    
    req.on('end', () => {
      try {
        if (!raw) {
          resolve({});
        } else {
          // Try to parse JSON
          const parsed = JSON.parse(raw);
          resolve(parsed);
        }
      } catch (err) {
        console.error('JSON parse error:', err);
        console.error('Raw body:', raw.substring(0, 500));
        reject(new Error('Invalid JSON in request body'));
      }
    });
    
    req.on('error', (err) => {
      reject(err);
    });
  });
}


// api/save_pdf.js - Fixed version with ES modules and better error handling
// import config from '../lib/config.js';

// export default async function handler(req, res) {
//   console.log('📄 /api/save_pdf called');
//   console.log('Method:', req.method);
  
//   // CORS headers
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   // Handle OPTIONS request
//   if (req.method === 'OPTIONS') {
//     return res.status(200).end();
//   }
  
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }

//   try {
//     // Parse request body
//     const body = await getJsonBody(req);
//     console.log('Request body keys:', Object.keys(body));
    
//     const { session_id, pdf_text, filename } = body;

//     // Validate required fields
//     if (!session_id) {
//       console.error('❌ Missing session_id');
//       return res.status(400).json({ 
//         error: 'Missing session_id',
//         hint: 'Please provide a session_id in the request body' 
//       });
//     }
    
//     if (!pdf_text) {
//       console.error('❌ Missing pdf_text');
//       return res.status(400).json({ 
//         error: 'Missing pdf_text',
//         hint: 'Please provide pdf_text in the request body' 
//       });
//     }

//     // Validate Supabase configuration
//     if (!config.supabase.url || !config.supabase.anonKey) {
//       console.error('❌ Supabase not configured');
//       return res.status(500).json({ 
//         error: 'Server configuration error',
//         detail: 'Supabase credentials not configured' 
//       });
//     }

//     // Clean PDF text - remove null characters and control characters
//     const cleanPdfText = pdf_text
//       .replace(/\u0000/g, '') // Remove null characters
//       .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
//       .trim();

//     console.log('📤 Saving to Supabase...');
//     console.log('Session ID:', session_id);
//     console.log('PDF text length:', cleanPdfText.length);
//     console.log('Filename:', filename || 'unknown.pdf');

//     // Prepare request to Supabase
//     const supabaseUrl = `${config.supabase.url}/rest/v1/pdf_context`;
//     const requestBody = JSON.stringify({ 
//       session_id, 
//       pdf_text: cleanPdfText, 
//       filename: filename || 'unknown.pdf',
//       created_at: new Date().toISOString()
//     });

//     console.log('Supabase URL:', supabaseUrl);
    
//     // Send to Supabase
//     const supabaseRes = await fetch(supabaseUrl, {
//       method: 'POST',
//       headers: {
//         'apikey': config.supabase.anonKey,
//         'Authorization': `Bearer ${config.supabase.anonKey}`,
//         'Content-Type': 'application/json',
//         'Prefer': 'return=representation' // Return the created record
//       },
//       body: requestBody
//     });

//     console.log('Supabase response status:', supabaseRes.status);
    
//     // Handle Supabase response
//     if (!supabaseRes.ok) {
//       const errorText = await supabaseRes.text();
//       console.error('❌ Supabase error:', errorText);
      
//       // Parse error if possible
//       let errorDetail;
//       try {
//         const errorJson = JSON.parse(errorText);
//         errorDetail = errorJson.message || errorJson.error || errorText;
//       } catch (e) {
//         errorDetail = errorText;
//       }
      
//       return res.status(500).json({ 
//         error: 'PDF save failed', 
//         detail: errorDetail,
//         hint: 'Check if the pdf_context table exists in Supabase'
//       });
//     }

//     // Parse successful response
//     let savedRecord;
//     try {
//       const responseText = await supabaseRes.text();
//       if (responseText) {
//         savedRecord = JSON.parse(responseText);
//         console.log('✅ PDF saved successfully:', savedRecord);
//       }
//     } catch (e) {
//       console.log('✅ PDF saved (no response body)');
//     }

//     // Return success
//     return res.status(200).json({ 
//       ok: true,
//       message: 'PDF saved successfully',
//       session_id: session_id,
//       text_length: cleanPdfText.length,
//       saved_record: savedRecord
//     });
    
//   } catch (err) {
//     console.error('❌ Unexpected error:', err);
//     return res.status(500).json({ 
//       error: 'Internal Server Error',
//       detail: config.isDevelopment ? err.message : undefined 
//     });
//   }
// }

// // Helper function to parse JSON body
// async function getJsonBody(req) {
//   return new Promise((resolve, reject) => {
//     let raw = '';
    
//     req.on('data', chunk => {
//       raw += chunk.toString();
//     });
    
//     req.on('end', () => {
//       try {
//         if (!raw) {
//           resolve({});
//         } else {
//           resolve(JSON.parse(raw));
//         }
//       } catch (err) {
//         console.error('JSON parse error:', err);
//         reject(new Error('Invalid JSON in request body'));
//       }
//     });
    
//     req.on('error', (err) => {
//       reject(err);
//     });
//   });
// }

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