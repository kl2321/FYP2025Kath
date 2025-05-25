stop.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { session } = req.body;

    try {
      const response = await fetch("https://cwhekhkphzcovivgqezd.supabase.co/rest/v1/control_signals", {
        method: 'POST',
        headers: {
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aGVraGtwaHpjb3ZpdmdxZXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NjgyNjgsImV4cCI6MjA2MzU0NDI2OH0.hmZt6bFgKSWel6HiXfEjmm85P_j8fcsUo71hVWmkF2A',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aGVraGtwaHpjb3ZpdmdxZXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NjgyNjgsImV4cCI6MjA2MzU0NDI2OH0.hmZt6bFgKSWel6HiXfEjmm85P_j8fcsUo71hVWmkF2A',
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          session_id: session,
          command: 'stop'
        }),
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
