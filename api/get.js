// ✅ /api/get.js - Supabase 数据查询转发
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { session } = req.query;

  if (!session) {
    return res.status(400).json({ error: 'Missing session ID' });
  }

  try {
    const response = await fetch(`https://inyqglzldyhuvenrfyli.supabase.co/rest/v1/sessions?session_id=eq.${session}`, {
      method: 'GET',
      headers: {
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlueXFnbHpsZHlodXZlbnJmeWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Njg4ODAsImV4cCI6MjA2MzU0NDg4MH0.5jyzoEVJf7eBNk3Y4cUTd-pQPNTjz2B9yFlo7t36auc",
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlueXFnbHpsZHlodXZlbnJmeWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Njg4ODAsImV4cCI6MjA2MzU0NDg4MH0.5jyzoEVJf7eBNk3Y4cUTd-pQPNTjz2B9yFlo7t36auc",
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    if (data.length > 0) {
      return res.status(200).json(data[0]);
    } else {
      return res.status(200).json({}); // 未找到结果
    }
  } catch (err) {
    console.error("❌ Supabase get error:", err);
    return res.status(500).json({ error: 'Supabase query failed' });
  }
}



// // ✅ /api/get.js
// import fs from 'fs';
// import path from 'path';

// export default function handler(req, res) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   const session = req.query.session;
//   const filePath = path.join('/tmp', 'sessions.json');

//   if (!session) {
//     return res.status(400).json({ error: 'Missing session ID' });
//   }

//   try {
//     const raw = fs.readFileSync(filePath, 'utf8');
//     const store = JSON.parse(raw);
//     if (store[session]) {
//       return res.status(200).json(store[session]);
//     }
//   } catch (e) {
//     console.warn("⚠️ No session store found or parsing error:", e.message);
//   }

//   return res.status(200).json({});
// }




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
