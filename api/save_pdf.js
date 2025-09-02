// api/save_pdf.js
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

    const supabaseRes = await fetch("https://cwhekhkphzcovivgqezd.supabase.co/rest/v1/pdf_context", {
      method: "POST",
      headers: {
        apikey: "你的key",
        Authorization: "Bearer 你的key", 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ session_id, pdf_text, filename: filename || 'unknown.pdf' })
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