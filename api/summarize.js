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

  // 添加 CORS 头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body;
  try {
    // 安全解析 JSON
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body;
    }
  } catch (err) {
    console.error('JSON parse error:', err);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  //const { text, avoid, context_pdf } = req.body;
  const { text, avoid, session_id } = req.body;

  if (!text) {
  return res.status(400).json({ error: 'Missing text to summarize' });
}

// 新增：从Supabase获取PDF内容
let context_pdf = '';
if (session_id) {
  try {
    console.log('获取PDF上下文 for session:', session_id);
    const pdfResponse = await fetch(`https://cwhekhkphzcovivgqezd.supabase.co/rest/v1/pdf_context?session_id=eq.${session_id}&order=created_at.desc&limit=1`, {
      headers: {
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aGVraGtwaHpjb3ZpdmdxZXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NjgyNjgsImV4cCI6MjA2MzU0NDI2OH0.hmZt6bFgKSWel6HiXfEjmm85P_j8fcsUo71hVWmkF2A",
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aGVraGtwaHpjb3ZpdmdxZXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NjgyNjgsImV4cCI6MjA2MzU0NDI2OH0.hmZt6bFgKSWel6HiXfEjmm85P_j8fcsUo71hVWmkF2A",
        'Content-Type': 'application/json'
      }
    });
    
    if (pdfResponse.ok) {
      const pdfData = await pdfResponse.json();
      if (pdfData.length > 0) {
        context_pdf = pdfData[0].pdf_text;
        console.log('PDF上下文获取成功, 长度:', context_pdf.length);
      }
    }
  } catch (pdfErr) {
    console.warn('PDF获取失败，继续without PDF:', pdfErr.message);
  }
}

  try {
    const messages = [
      {
        role: "system",
        content: "You are a meeting assistant for a student group project. You will analyze transcripts and return structured summaries in JSON format. Ignore the part that is irrelevant to the team's project work or collaboration."
      },
      {
        role: "user",
        content: `You will be given:
(1) the latest meeting transcript; and
(2) optional project reference material extracted from a PDF (context).
:
Your job: 
1. Produce a concise, non-redundant update focused on new content. Where helpful, draw on the PDF context to support or challenge the teams' points.
2. Identify any decisions made or discussed, interpret from the transcript the problem they are solving, the group is discussing.
3. Extract explicit knowledge (factual, documented) that supports or goes against the decision.
4. Extract tacit knowledge (experiential or intuitive) that supports or goes against the decision.
5. Provide reasoning behind decisions, their logic flow in this format: the team discussed A -> B -> C...
6. Review and critically evaluate the team's current decisions and discussed points. Suggest related tools, materials, hyperlinks or examples to improve their decisions and enhance knowledge.

Avoid repeating any of the previously summarized content below:
${avoid || 'N/A'}

When using the PDF, cite inline as [PDF].

Return ONLY structured JSON. Do not add commentary, explanation, or Markdown code block. The format should be::
{
  "summary": "...",
  "decision": ["..."],
  "explicit": ["..."],
  "tacit": ["..."],
  "reasoning": "...",
  "suggestions": ["...", "..."]
}

Transcript:
${text}
PDF Context:
${context_pdf ? context_pdf.slice(0, 12000) : 'N/A'}`

      }
    ];
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages

        // messages: [
        //   { role: "system", content: "You are a meeting minute assistant talented at summarizing transcript into meeting minutes。" },
        //   { role: "user", content: `Please summarize the following for the meeting：\n\n${text}` }
        // ]
      })
    });

    const data = await openaiRes.json();
    //  safety check
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    console.warn("🟨 OpenAI returned empty or malformed response:", JSON.stringify(data, null, 2));
    return res.status(200).json({ summary: '' }); // fallback 防止 500 错误
    }
    
    // let parsed;
    // try {
    //   parsed = JSON.parse(data.choices[0].message.content);
    // } catch (e) {
    //   console.error("❌ Failed to parse GPT output:", data.choices[0].message.content);
    //   return res.status(200).json({ summary: '', transcript: text });
    // }

    let parsed;
    try {
      const content = data.choices[0].message.content.trim();
      const jsonString = content
        .replace(/^```json\s*/i, '')
        .replace(/```$/, '');
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error("❌ Failed to parse GPT output:", data.choices[0].message.content);
      return res.status(200).json({ summary: '', transcript: text });
    }



    
    const summary = data.choices?.[0]?.message?.content ?? '';

    res.status(200).json({ 
        transcript: text,
        summary: parsed.summary || '',
        decision: parsed.decision || [],
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
