// /api/summarize.js
// let body = req.body;
// if (typeof req.body === 'string') {
//   try {
//     body = JSON.parse(req.body);
//   } catch (err) {
//     return res.status(400).json({ error: 'Invalid JSON format' });
//   }
// }

export default async function handler(req, res) {
  const { text, avoid } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text to summarize' });
  }

  try {
    const messages = [
      {
        role: "system",
        content: "You are a meeting assistant. Your job is to summarize meeting transcripts. Your summary should highlight only new key points based on the current transcript, and avoid repeating any points mentioned previously."
      },
      {
        role: "user",
        content: `Here is the current transcript:\n\n${text}\n\nAvoid repeating the following previously summarized content:\n\n${avoid || 'N/A'}`
      }
    ];
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages

        // messages: [
        //   { role: "system", content: "You are a meeting minute assistant talented at summarizing transcript into meeting minutes。" },
        //   { role: "user", content: `Please summarize the following for the meeting：\n\n${text}` }
        // ]
      })
    });

    const data = await openaiRes.json();
    // 🛡️ 安全检查
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    console.warn("🟨 OpenAI returned empty or malformed response:", JSON.stringify(data, null, 2));
    return res.status(200).json({ summary: '' }); // fallback 防止 500 错误
    }



    
    const summary = data.choices?.[0]?.message?.content ?? '';

    res.status(200).json({ 
        transcript: text,
        summary
     });

  } catch (err) {
    console.error("❌ summarize error:", err);
    res.status(500).json({ error: 'Summarize failed' });
  }
}
