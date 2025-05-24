// stop.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'POST') {
    const { session } = req.body;

    const response = await fetch("https://inyqglzldyhuvenrfyli.supabase.co/rest/v1/sessions", {
      method: 'POST',
      headers: {
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlueXFnbHpsZHlodXZlbnJmeWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Njg4ODAsImV4cCI6MjA2MzU0NDg4MH0.5jyzoEVJf7eBNk3Y4cUTd-pQPNTjz2B9yFlo7t36auc',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlueXFnbHpsZHlodXZlbnJmeWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Njg4ODAsImV4cCI6MjA2MzU0NDg4MH0.5jyzoEVJf7eBNk3Y4cUTd-pQPNTjz2B9yFlo7t36auc',
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        session_id: session,
        command: 'stop'
      }),
    });

    res.status(200).json({ ok: true });
  } else {
    res.status(405).end();
  }
}
