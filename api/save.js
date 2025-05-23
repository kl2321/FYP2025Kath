export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = await getJsonBody(req); // 👈 安全地解析 JSON
    const { session, transcript, summary } = body;

    if (!session || !transcript || !summary) {
      console.log('❌ Missing fields:', body);
      return res.status(400).json({ error: 'Missing fields' });
    }

    globalThis.__store = globalThis.__store || {};
    globalThis.__store[session] = { transcript, summary };

    console.log('✅ Stored session:', session);
    console.log('🧠 Transcript:', transcript.slice(0, 50));
    console.log('🧠 Summary:', summary.slice(0, 50));

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('❌ save.js exception:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 🔧 用于可靠提取 JSON body
async function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => raw += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
  });
}
