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
        content: "You are a meeting assistant. You will analyze transcripts and return structured summaries in JSON format."
      },
      {
        role: "user",
        content: `You will be given a meeting transcript. Please:
1. Provide a one-sentence summary of the new content.
2. Identify any decisions made or discussed.
3. Extract explicit knowledge (factual, documented).
4. Extract tacit knowledge (experiential or intuitive).
5. Provide reasoning behind decisions.
6. Suggest related tools, materials, or examples.

Avoid repeating any of the previously summarized content below:
${avoid || 'N/A'}

Return ONLY structured JSON in the format:
{
  "summary": "...",
  "decision": ["..."],
  "explicit": ["..."],
  "tacit": ["..."],
  "reasoning": "...",
  "suggestions": ["...", "..."]
}

Transcript:
${text}`
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
    
    let parsed;
    try {
      parsed = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error("❌ Failed to parse GPT output:", data.choices[0].message.content);
      return res.status(200).json({ summary: '', transcript: text });
    }



    
    const summary = data.choices?.[0]?.message?.content ?? '';

    res.status(200).json({ 
        transcript: text,
        summary: parsed.summary || '',
        ecision: parsed.decision || [],
        explicit: parsed.explicit || [],
        tacit: parsed.tacit || [],
        reasoning: parsed.reasoning || '',
        suggestions: parsed.suggestions || []
     });

  } catch (err) {
    console.error("❌ summarize error:", err);
    res.status(500).json({ error: 'Summarize failed' });
  }
}
