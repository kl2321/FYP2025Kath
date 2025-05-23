// ✅ /api/get.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const session = req.query.session;
  const filePath = path.join('/tmp', 'sessions.json');

  if (!session) {
    return res.status(400).json({ error: 'Missing session ID' });
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const store = JSON.parse(raw);
    if (store[session]) {
      return res.status(200).json(store[session]);
    }
  } catch (e) {
    console.warn("⚠️ No session store found or parsing error:", e.message);
  }

  return res.status(200).json({});
}




// export default async function handler(req, res) {
//   // 添加跨域响应头
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   const session = req.query.session;

//   if (!session) {
//     return res.status(400).json({ error: 'Missing session ID' });
//   }

//   try {
//     globalThis.__store = globalThis.__store || {};
//     const result = globalThis.__store[session];

//     if (result) {
//       return res.status(200).json(result);
//     } else {
//       return res.status(200).json({}); // Not ready yet
//     }
//   } catch (err) {
//     console.error('❌ Error in /api/get:', err);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// }
