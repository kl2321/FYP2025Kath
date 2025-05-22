import fetch from 'node-fetch';
export default async function handler(req, res) {
  const file = req.body.get('file');
  const form = new FormData();
  form.append('file', file);
  form.append('model', 'whisper-1');
  const tResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form
  });
  const { text } = await tResp.json();

  const pResp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Extract key points and sentiment' },
        { role: 'user', content: text }
      ]
    })
  });
  const ai = await pResp.json();
  const summary = ai.choices[0].message.content;
  res.json({ text, summary });
}
