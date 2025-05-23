await fetch('https://inyqglzldyhuvenrfyli.supabase.co/rest/v1/sessions', {
  method: 'POST',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlueXFnbHpsZHlodXZlbnJmeWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Njg4ODAsImV4cCI6MjA2MzU0NDg4MH0.5jyzoEVJf7eBNk3Y4cUTd-pQPNTjz2B9yFlo7t36auc',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlueXFnbHpsZHlodXZlbnJmeWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Njg4ODAsImV4cCI6MjA2MzU0NDg4MH0.5jyzoEVJf7eBNk3Y4cUTd-pQPNTjz2B9yFlo7t36auc',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  },
  body: JSON.stringify({
    session_id: sessionId,
    transcript: result.transcript,
    summary: result.summary
  })
});




// // ✅ /api/save.js
// import fs from 'fs';
// import path from 'path';

// export default async function handler(req, res) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Invalid method' });
//   }

//   const body = await getJsonBody(req);
//   const { session, transcript, summary } = body;

//   if (!session || !transcript || !summary) {
//     return res.status(400).json({ error: 'Missing fields' });
//   }

//   const filePath = path.join('/tmp', 'sessions.json');

//   let store = {};
//   try {
//     const raw = fs.readFileSync(filePath, 'utf8');
//     store = JSON.parse(raw);
//   } catch (e) {
//     console.log("📁 Creating new session store.");
//   }

//   store[session] = { transcript, summary };
//   fs.writeFileSync(filePath, JSON.stringify(store));

//   console.log('✅ Saved session:', session);
//   res.status(200).json({ ok: true });
// }

// async function getJsonBody(req) {
//   return new Promise((resolve, reject) => {
//     let raw = '';
//     req.on('data', chunk => raw += chunk);
//     req.on('end', () => {
//       try {
//         resolve(JSON.parse(raw));
//       } catch (err) {
//         reject(err);
//       }
//     });
//   });
// }

// export default async function handler(req, res) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   if (req.method !== 'POST') {
//     console.log('❌ Invalid method:', req.method);
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }

//   try {
//     const body = await getJsonBody(req); // 👈 安全地解析 JSON
//     const { session, transcript, summary } = body;

//     if (!session || !transcript || !summary) {
//       console.log('❌ Missing fields:', body);
//       return res.status(400).json({ error: 'Missing fields' });
//     }

//     globalThis.__store = globalThis.__store || {};
//     globalThis.__store[session] = { transcript, summary };

//     console.log('✅ Stored session:', session);
//     console.log('🧠 Transcript:', transcript.slice(0, 50));
//     console.log('🧠 Summary:', summary.slice(0, 50));

//     return res.status(200).json({ ok: true });
//   } catch (err) {
//     console.error('❌ save.js exception:', err);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// }

// // 🔧 用于可靠提取 JSON body
// async function getJsonBody(req) {
//   return new Promise((resolve, reject) => {
//     let raw = '';
//     req.on('data', chunk => raw += chunk);
//     req.on('end', () => {
//       try {
//         resolve(JSON.parse(raw));
//       } catch (err) {
//         reject(err);
//       }
//     });
//   });
// }
