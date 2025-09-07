// api/save_pdf.js
const config = require('../lib/config');
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = await getJsonBody(req);
    const { session_id, pdf_text, filename } = body;

    if (!session_id || !pdf_text) {
      return res.status(400).json({ error: 'Missing session_id or pdf_text' });
    }

    // 🆕 清理PDF文本，移除null字符和其他问题字符
const cleanPdfText = pdf_text
  .replace(/\u0000/g, '') // 移除null字符
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 移除控制字符
  .trim();

console.log('📤 发送到Supabase...');

    

    const supabaseRes = await fetch(`${config.supabase.url}/rest/v1/pdf_context`, {
      method: "POST",
      headers: {
        apikey: config.supabase.anonKey,
        Authorization: `Bearer ${config.supabase.anonKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        session_id, 
        pdf_text: cleanPdfText, 
        filename: filename || 'unknown.pdf' 
      })
    });

    if (!supabaseRes.ok) {
      const errorText = await supabaseRes.text();
      return res.status(500).json({ error: 'PDF save failed', detail: errorText });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => raw += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); } 
      catch (err) { reject(err); }
    });
  });
}