// // analyze.js
// // Figma插件后端：接收record.html上传的音频，使用Whisper转词，再让GPT概括

// const formidable = require('formidable');
// const fs = require('fs');
// const path = require('path');
// const { Readable } = require('stream');
// const { OpenAI } = require('openai');

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // 关闭默认body解析器，允许处理文件
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const form = formidable();

//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       return res.status(500).json({ error: 'Form parse error', detail: err.message });
//     }

//     const file = files.file?.[0];
//     if (!file) {
//       return res.status(400).json({ error: 'No audio file uploaded' });
//     }

//     try {
//       // Whisper API 转音为文
//       const transcription = await openai.audio.transcriptions.create({
//         file: fs.createReadStream(file.filepath),
//         model: 'whisper-1',
//         response_format: 'text'
//       });

//       // GPT 概括为要点
//       const completion = await openai.chat.completions.create({
//         model: 'gpt-3.5-turbo',
//         messages: [
//           {
//             role: 'user',
//             content: `请概括我下面的会议记录：\n\n${transcription}`,
//           },
//         ],
//       });

//       res.status(200).json({ transcript: transcription, summary: completion.choices[0].message.content });
//     } catch (err) {
//       console.error('AI processing error:', err);
//       res.status(500).json({ error: 'AI processing failed', detail: err.message });
//     }
//   });
// }

import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({ uploadDir: '/tmp', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!rawFile || !rawFile.filepath) {
      return res.status(400).json({ error: 'Audio file is missing' });
    }

    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) {
      return res.status(500).json({ error: 'Missing OpenAI API key' });
    }

    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(rawFile.filepath));
      formData.append('model', 'whisper-1');

      const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAIKey}`,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      const whisperJson = await whisperRes.json();

      if (!whisperRes.ok) {
        return res.status(500).json({ error: 'Whisper API failed', detail: whisperJson });
      }

      const transcript = whisperJson.text;

      const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: `请总结以下会议内容：\n\n${transcript}` }],
        }),
      });

      const gptJson = await gptRes.json();

      return res.status(200).json({
        transcript,
        summary: gptJson.choices[0].message.content,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Internal Server Error', detail: err.message });
    }
  });
}



// import formidable from 'formidable';
// import fs from 'fs';
// import FormData from 'form-data';

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const form = new formidable.IncomingForm({
//     uploadDir: '/tmp',
//     keepExtensions: true,
//   });

//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       console.error('❌ Form parse error:', err);
//       return res.status(500).json({ error: 'Form parse error', detail: err.message });
//     }

//     const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;
//     if (!rawFile || !rawFile.filepath) {
//       return res.status(400).json({ error: 'Audio file is missing' });
//     }

//     const openAIKey = process.env.OPENAI_API_KEY;
//     if (!openAIKey) {
//       return res.status(500).json({ error: 'Missing OpenAI API key' });
//     }

//     try {
//       // 🔁 Whisper API
//       const formData = new FormData();
//       formData.append('file', fs.createReadStream(rawFile.filepath));
//       formData.append('model', 'whisper-1'); // ✅ 这个必须有

//       const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${openAIKey}`,
//           ...formData.getHeaders(), // ✅ 必须设置 multipart boundary
//         },
//         body: formData,
//       });

//       const whisperJson = await whisperRes.json();
//       console.log('🧠 Whisper result:', whisperJson);

//       if (!whisperRes.ok) {
//         return res.status(500).json({ error: 'Whisper API failed', detail: whisperJson });
//       }

//       const transcript = whisperJson.text;

//       // 🧠 GPT 摘要
//       const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${openAIKey}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           model: 'gpt-3.5-turbo',
//           messages: [{ role: 'user', content: `请总结以下会议内容：\n\n${transcript}` }],
//         }),
//       });

//       const gptJson = await gptRes.json();
//       if (!gptRes.ok) {
//         return res.status(500).json({ error: 'GPT API failed', detail: gptJson });
//       }

//       return res.status(200).json({
//         transcript,
//         summary: gptJson.choices[0].message.content,
//       });
//     } catch (err) {
//       console.error('🔥 Internal Server Error:', err);
//       return res.status(500).json({ error: 'Internal Server Error', detail: err.message });
//     }
//   });
// }



// import { IncomingForm } from 'formidable';
// import fs from 'fs';
// import { FormData } from 'formdata-node';
// import { fileFromPath } from 'formdata-node/file-from-path';
// import { fetch } from 'undici'; // Node 18+ 可用，无需额外装

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const form = new IncomingForm({
//     uploadDir: '/tmp',
//     keepExtensions: true,
//   });

//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       console.error('❌ Form parse error:', err);
//       return res.status(500).json({ error: 'Form parse error', detail: err.message });
//     }

//     const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;
//     if (!rawFile || !rawFile.filepath) {
//       return res.status(400).json({ error: 'Audio file is missing' });
//     }

//     const openAIKey = process.env.OPENAI_API_KEY;
//     if (!openAIKey) {
//       return res.status(500).json({ error: 'Missing OpenAI API key' });
//     }

//     try {
//       const formData = new FormData();
//       formData.set('file', await fileFromPath(rawFile.filepath));
//       formData.set('model', 'whisper-1');

//       const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${openAIKey}`,
//         },
//         body: formData,
//       });

//       const whisperJson = await whisperRes.json();
//       console.log('🧠 Whisper result:', whisperJson);

//       if (!whisperRes.ok) {
//         return res.status(500).json({ error: 'Whisper API failed', detail: whisperJson });
//       }

//       const transcript = whisperJson.text;

//       const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${openAIKey}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           model: 'gpt-3.5-turbo',
//           messages: [{ role: 'user', content: `请总结以下会议内容：\n\n${transcript}` }],
//         }),
//       });

//       const gptJson = await gptRes.json();
//       if (!gptRes.ok) {
//         return res.status(500).json({ error: 'GPT API failed', detail: gptJson });
//       }

//       return res.status(200).json({
//         transcript,
//         summary: gptJson.choices[0].message.content,
//       });
//     } catch (err) {
//       console.error('🔥 Internal processing error:', err);
//       return res.status(500).json({ error: 'Internal Server Error', detail: err.message });
//     }
//   });
// }

// import { IncomingForm } from 'formidable';
// import fs from 'fs';
// import FormData from 'form-data';

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const form = new IncomingForm({
//     uploadDir: '/tmp',
//     keepExtensions: true,
//   });

//   form.parse(req, async (err, fields, files) => {
//     console.log("📦 received files:", files); // ✅ 这行是调试重点！

//     if (err) {
//       return res.status(500).json({ error: 'Form parse error', detail: err.message });
//     }

//     const audioFile = Array.isArray(files.file) ? files.file[0] : files.file;
//     if (!audioFile || !audioFile.filepath) {
//       return res.status(400).json({ error: 'Audio file is missing' });
//     }

//     const openAIKey = process.env.OPENAI_API_KEY;
//     if (!openAIKey) {
//       return res.status(500).json({ error: 'Missing OpenAI API key' });
//     }

//     try {
//       const formData = new FormData();
//       formData.append('file', fs.createReadStream(audioFile.filepath));
//       formData.append('model', 'whisper-1');

//       const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
//         method: 'POST',
//         headers: { Authorization: `Bearer ${openAIKey}` },
//         body: formData,
//       });

//       const whisperJson = await whisperRes.json();
//       if (!whisperRes.ok) {
//         return res.status(500).json({ error: 'Whisper API failed', detail: whisperJson });
//       }

//       const transcript = whisperJson.text;

//       const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${openAIKey}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           model: 'gpt-3.5-turbo',
//           messages: [{ role: 'user', content: `请总结以下会议内容：\n\n${transcript}` }],
//         }),
//       });

//       const gptJson = await gptRes.json();
//       if (!gptRes.ok) {
//         return res.status(500).json({ error: 'GPT API failed', detail: gptJson });
//       }

//       return res.status(200).json({
//         transcript,
//         summary: gptJson.choices[0].message.content,
//       });
//     } catch (err) {
//       return res.status(500).json({ error: 'Internal Server Error', detail: err.message });
//     }
//   });
// }


// import { IncomingForm } from 'formidable';
// import fs from 'fs';
// import FormData from 'form-data';

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const apiKey = process.env.OPENAI_API_KEY;
//   if (!apiKey) {
//     return res.status(500).json({ error: 'Missing OpenAI API key' });
//   }

//   const form = new IncomingForm({
//     uploadDir: '/tmp',
//     keepExtensions: true,
//     maxFileSize: 50 * 1024 * 1024, // 最大支持 50MB
//   });

//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       console.error('❌ Form parse error:', err);
//       return res.status(500).json({ error: 'Form parse error', detail: err.message });
//     }

//     const audioFile = files.file;
//     if (!audioFile || !audioFile.filepath) {
//       return res.status(400).json({ error: 'Audio file is missing' });
//     }

//     try {
//       const formData = new FormData();
//       formData.append('file', fs.createReadStream(audioFile.filepath));
//       formData.append('model', 'whisper-1');

//       const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${apiKey}`,
//         },
//         body: formData,
//       });

//       const whisperJson = await whisperRes.json();
//       if (!whisperRes.ok) {
//         return res.status(500).json({ error: 'Whisper API failed', detail: whisperJson });
//       }

//       const transcript = whisperJson.text;

//       const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${apiKey}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           model: 'gpt-3.5-turbo',
//           messages: [{ role: 'user', content: `请总结以下会议内容：\n\n${transcript}` }],
//         }),
//       });

//       const gptJson = await gptRes.json();
//       if (!gptRes.ok) {
//         return res.status(500).json({ error: 'GPT API failed', detail: gptJson });
//       }

//       res.status(200).json({ transcript, summary: gptJson.choices[0].message.content });
//     } catch (err) {
//       console.error('🔥 Processing error:', err);
//       res.status(500).json({ error: 'Internal server error', detail: err.message });
//     }
//   });
// }


// const formidable = require('formidable');
// const fs = require('fs');
// const FormData = require('form-data');

// exports.config = {
//   api: {
//     bodyParser: false,
//   },
// };



// exports.default = async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const apiKey = process.env.OPENAI_API_KEY;
//   if (!apiKey) {
//     return res.status(500).json({ error: 'Missing OpenAI API key' });
//   }

//   const form = new formidable.IncomingForm({ multiples: false });
//   form.uploadDir = '/tmp';
//   form.keepExtensions = true;

//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       console.error('❌ Form parse error:', err);
//       return res.status(500).json({ error: 'Form parse error' });
//     }

//     const audioFile = files.file;
//     if (!audioFile || !audioFile.filepath) {
//       return res.status(400).json({ error: 'Audio file is missing' });
//     }

//     try {
//       const formData = new FormData();
//       formData.append('file', fs.createReadStream(audioFile.filepath));
//       formData.append('model', 'whisper-1');

//       const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${apiKey}`
//         },
//         body: formData,
//       });

//       const whisperJson = await whisperRes.json();

//       if (!whisperRes.ok) {
//         return res.status(500).json({ error: 'Whisper API error', detail: whisperJson });
//       }

//       const transcript = whisperJson.text;

//       const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${apiKey}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           model: 'gpt-3.5-turbo',
//           messages: [{ role: 'user', content: `请总结以下会议内容：\n\n${transcript}` }],
//         }),
//       });

//       const gptJson = await gptRes.json();

//       if (!gptRes.ok) {
//         return res.status(500).json({ error: 'OpenAI GPT API error', detail: gptJson });
//       }

//       res.status(200).json({ summary: gptJson.choices[0].message.content });
//     } catch (error) {
//       console.error('🔥 Processing error:', error);
//       res.status(500).json({ error: 'Internal Server Error', detail: error.message });
//     }
//   });
// }



// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const apiKey = process.env.OPENAI_API_KEY;
//   if (!apiKey) {
//     return res.status(500).json({ error: 'Missing OpenAI API key' });
//   }

//   try {
//     const { transcript } = req.body;

//     if (!transcript) {
//       return res.status(400).json({ error: 'Missing transcript' });
//     }

//     const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${apiKey}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         model: 'gpt-3.5-turbo',
//         messages: [
//           {
//             role: 'user',
//             content: `请总结以下会议内容:\n\n${transcript}`
//           }
//         ]
//       })
//     });

//     const gptJson = await gptRes.json();

//     if (!gptRes.ok) {
//       return res.status(500).json({ error: 'OpenAI API error', detail: gptJson });
//     }

//     res.status(200).json({ summary: gptJson.choices[0].message.content });
//   } catch (err) {
//     console.error('🔥 GPT error:', err);
//     res.status(500).json({ error: 'Internal Server Error', detail: err.message });
//   }
// }



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
