export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Missing transcript' });
    }

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `请总结以下会议内容:\n\n${transcript}`
          }
        ]
      })
    });

    const gptJson = await gptRes.json();

    if (!gptRes.ok) {
      return res.status(500).json({ error: 'OpenAI API error', detail: gptJson });
    }

    res.status(200).json({ summary: gptJson.choices[0].message.content });
  } catch (err) {
    console.error('🔥 GPT error:', err);
    res.status(500).json({ error: 'Internal Server Error', detail: err.message });
  }
}



// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const apiKey = process.env.OPENAI_API_KEY;
//   if (!apiKey) {
//     return res.status(500).json({ error: 'Missing OpenAI API key' });
//   }

//   const { transcript } = req.body;

//   if (!transcript) {
//     return res.status(400).json({ error: 'Missing transcript' });
//   }

//   try {
//     const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${apiKey}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         model: 'gpt-3.5-turbo',
//         messages: [
//           {
//             role: 'user',
//             content: `Please summarize the following meeting transcript:\n\n${transcript}`
//           }
//         ]
//       })
//     });

//     const gptJson = await gptRes.json();
//     const summary = gptJson.choices?.[0]?.message?.content;

//     res.status(200).json({ summary, raw: gptJson });
//   } catch (err) {
//     console.error("GPT error:", err);
//     res.status(500).json({ error: "Failed to generate summary", detail: err.message });
//   }
// }


// import fetch from 'node-fetch';
// export default async function handler(req, res) {
//   const file = req.body.get('file');
//   const form = new FormData();
//   form.append('file', file);
//   form.append('model', 'whisper-1');
//   const tResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
//     method: 'POST',
//     headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
//     body: form
//   });
//   const { text } = await tResp.json();

//   const pResp = await fetch('https://api.openai.com/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({
//       model: 'gpt-4',
//       messages: [
//         { role: 'system', content: 'Extract key points and sentiment' },
//         { role: 'user', content: text }
//       ]
//     })
//   });
//   const ai = await pResp.json();
//   const summary = ai.choices[0].message.content;
//   res.json({ text, summary });
// }
