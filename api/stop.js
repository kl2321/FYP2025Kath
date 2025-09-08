// api/stop.js
import config from '../lib/config.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    // 修改这里：接收正确的参数
    const { session_id, command, value } = req.body;

    // 验证必需参数
    if (!session_id || !command) {
      return res.status(400).json({ 
        error: 'Missing session_id or command',
        received: { session_id, command }
      });
    }

    try {
      // 构建请求体
      const requestBody = {
        session_id: session_id,
        command: command
      };
      
      // 如果有 value（用于 set_cycle），添加它
      if (value !== undefined) {
        requestBody.value = value;
      }

      const response = await fetch(`${config.supabase.url}/rest/v1/control_signals`, {
        method: 'POST',
        headers: {
          apikey: config.supabase.anonKey,
          Authorization: `Bearer ${config.supabase.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("❌ Supabase insert error:", text);
        return res.status(500).json({ error: 'Supabase insert failed', detail: text });
      }

      return res.status(200).json({ ok: true });

    } catch (err) {
      console.error("❌ Fetch error:", err);
      return res.status(500).json({ error: 'Fetch exception', detail: err.message });
    }
  } else {
    return res.status(405).end();
  }
}
