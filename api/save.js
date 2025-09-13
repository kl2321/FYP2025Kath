import config from '../lib/config.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // CORS preflight
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = await getJsonBody(req);
    
    const {
      session,
      transcript,
      summary,
      decision,
      explicit,
      tacit,
      reasoning,
      suggestions,
      is_final,
      is_intermediate,    // 新增
      segment_number,     // 新增
      segment_count,      // 新增
      duration_minutes,   // 新增
      speaker_count,      // 新增
      metadata           // 新增
    } = body;

    if (!session || !transcript || !summary) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 构建要保存的数据对象
    const saveData = {
      session_id: session,
      transcript,
      summary,
      decision,
      explicit,
      tacit,
      reasoning,
      suggestions,
      is_final: is_final || false,
      is_intermediate: is_intermediate || false
    };

    // 只添加存在的新字段（避免undefined）
    if (segment_number !== undefined) saveData.segment_number = segment_number;
    if (segment_count !== undefined) saveData.segment_count = segment_count;
    if (duration_minutes !== undefined) saveData.duration_minutes = duration_minutes;
    if (speaker_count !== undefined) saveData.speaker_count = speaker_count;
    if (metadata !== undefined) saveData.metadata = metadata;

    const supabaseRes = await fetch(`${config.supabase.url}/rest/v1/sessions`, {
      method: "POST",
      headers: {
        apikey: config.supabase.anonKey,
        Authorization: `Bearer ${config.supabase.anonKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(saveData)
    });

    const responseText = await supabaseRes.text();
    console.log('📦 Supabase raw response:', responseText);

    if (!supabaseRes.ok) {
      console.error('❌ Supabase save failed:', responseText);
      return res.status(500).json({ error: 'Supabase save failed', detail: responseText });
    }

    // 记录保存类型以便调试
    const saveType = is_final ? 'final' : is_intermediate ? 'intermediate' : 'segment';
    console.log(`✅ Saved to Supabase: ${session} (${saveType})`);
    
    if (segment_number) console.log(`   Segment #${segment_number}`);
    if (duration_minutes) console.log(`   Duration: ${duration_minutes} min`);
    if (speaker_count) console.log(`   Speakers: ${speaker_count}`);
    
    return res.status(200).json({ ok: true });
    
  } catch (err) {
    console.error('❌ Exception in save.js:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

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
// import config from '../lib/config.js';
// export default async function handler(req, res) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   if (req.method === 'OPTIONS') {
//     return res.status(200).end(); // CORS preflight
//   }

//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }
//   // let body = req.body;
//   // if (typeof req.body === 'string') {
//   //   try {
//   //     body = JSON.parse(req.body);
//   //   } catch (err) {
//   //     return res.status(400).json({ error: 'Invalid JSON format' });
//   //   }
//   // }
  

//   try {
//     const body = await getJsonBody(req);
//     //const { session, transcript, summary } = body;
//     const {
//     session,
//     transcript,
//     summary,
//     decision,
//     explicit,
//     tacit,
//     reasoning,
//     suggestions,
//     is_final,
//     is_intermediate,    // 新增
//     segment_number,     // 新增
//     segment_count,      // 新增
//     duration_minutes,   // 新增
//     speaker_count,      // 新增
//     metadata    
  
//   } = body;

//     if (!session || !transcript || !summary) {
//       return res.status(400).json({ error: 'Missing fields' });
//     }
//     const supabaseRes = await fetch(`${config.supabase.url}/rest/v1/sessions`, {
//       method: "POST",
//       headers: {
//         apikey: config.supabase.anonKey,
//         Authorization: `Bearer ${config.supabase.anonKey}`,
//         "Content-Type": "application/json"
//       },

  
//       body: JSON.stringify({
//         session_id: session,
//         transcript,
//         summary,
//         decision,
//         explicit,
//         tacit,
//         reasoning,
//         suggestions,
//         is_final: is_final || false
//       })
//     });

//     const responseText = await supabaseRes.text();
//     console.log('📦 Supabase raw response:', responseText);

//     if (!supabaseRes.ok) {
//       //const text = await supabaseRes.text();
//       console.error('❌ Supabase save failed:', responseText);
//       return res.status(500).json({ error: 'Supabase save failed', detail:responseText });
//     }

//     console.log("✅ Saved to Supabase:", session);
//     return res.status(200).json({ ok: true });
//   } catch (err) {
//     console.error('❌ Exception in save.js:', err);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
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
