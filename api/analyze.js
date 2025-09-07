// import { IncomingForm } from 'formidable';
// import fs from 'fs';
// import axios from 'axios';
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
//       // ✅ Whisper API with axios + form-data
//       const formData = new FormData();
//       formData.append('file', fs.createReadStream(rawFile.filepath));
//       formData.append('model', 'whisper-1');

//       console.log('📤 Sending to Whisper...');
//       const whisperRes = await axios.post(
//         'https://api.openai.com/v1/audio/transcriptions',
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${openAIKey}`,
//             ...formData.getHeaders(), // 👈 包含 multipart boundary
//           },
//         }
//       );

//       const transcript = whisperRes.data.text;
//       console.log('✅ Whisper transcript:', transcript);

//       // 🔁 GPT summary
//       const gptRes = await axios.post(
//         'https://api.openai.com/v1/chat/completions',
//         {
//           model: 'gpt-4o-mini',
//           //messages: [{ role: 'user', content: `please summarize the following and split into explicit and tacit knowledge:\n\n${transcript}` }],
//           messages: [{
//             role: 'user',
//             content: `Please summarize the following meeting transcript and split the content into explicit and tacit knowledge. Only include conversation related to the team's project work or collaboration.\n\n- Explicit knowledge refers to documented, factual information such as data, specifications, or user feedback.\n- Tacit knowledge refers to intuitive insights, experience-based observations, or subjective impressions shared by team members.\n\nSummarize the conversation and categorize the relevant points into the two types.\n\nTranscript:\n\n${transcript}`
//           }]
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${openAIKey}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       return res.status(200).json({
//         transcript,
//         summary: gptRes.data.choices[0].message.content,
//       });
//     } catch (err) {
//       console.error(' Error during processing:', err?.response?.data || err.message);
//       return res.status(500).json({
//         error: 'Processing failed',
//         detail: err?.response?.data || err.message,
//       });
//     }
//   });
// }

// api/analyze.js
// 音频处理中心 - 接收音频块，转录并分析

import { IncomingForm } from 'formidable';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

// 引入集中配置
const config = require('../lib/config');

// Vercel需要这个配置来处理文件上传
export const apiConfig = {
  api: {
    bodyParser: false,  // 禁用默认的body解析，因为我们处理文件上传
  },
};

export default async function handler(req, res) {
  // 添加CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 检查OpenAI配置
  if (!config.openai.apiKey) {
    console.error('OpenAI API key not configured');
    return res.status(500).json({ error: 'Server configuration error: Missing OpenAI API key' });
  }

  // 创建表单解析器来处理文件上传
  const form = new IncomingForm({
    uploadDir: '/tmp',        // Vercel的临时文件目录
    keepExtensions: true,     // 保留文件扩展名
    maxFileSize: 50 * 1024 * 1024,  // 50MB限制
  });

  // 解析上传的表单数据
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parse error:', err);
      return res.status(500).json({ 
        error: 'Form parse error', 
        detail: config.isDevelopment ? err.message : undefined 
      });
    }

    // 获取上传的音频文件
    const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!rawFile || !rawFile.filepath) {
      return res.status(400).json({ error: 'Audio file is missing' });
    }

    console.log('📁 Received audio file:', {
      name: rawFile.originalFilename,
      size: rawFile.size,
      type: rawFile.mimetype
    });

    try {
      // ========== Step 1: 音频转文字 (Whisper) ==========
      const formData = new FormData();
      formData.append('file', fs.createReadStream(rawFile.filepath));
      formData.append('model', config.openai.whisperModel || 'whisper-1');
      
      // 可选：添加语言提示
      // formData.append('language', 'en'); // 或 'zh' 中文

      console.log('🔤 Sending to Whisper API...');
      
      const whisperRes = await axios.post(
        `${config.openai.apiUrl}/audio/transcriptions`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${config.openai.apiKey}`,
            ...formData.getHeaders(), // 包含 multipart boundary
          },
          timeout: 60000, // 60秒超时
        }
      );

      const transcript = whisperRes.data.text;
      console.log('✅ Whisper transcript received, length:', transcript.length);

      // ========== Step 2: 文本分析 (GPT) ==========
      
      // 构建分析提示词
      const systemPrompt = `You are a meeting assistant analyzing team discussions. 
      Focus on project-related content and collaboration.
      Categorize insights into explicit knowledge (documented facts) and tacit knowledge (experiential insights).`;
      
      const userPrompt = `Please summarize the following meeting transcript and split the content into explicit and tacit knowledge.

Only include conversation related to the team's project work or collaboration.

- Explicit knowledge refers to documented, factual information such as data, specifications, or user feedback.
- Tacit knowledge refers to intuitive insights, experience-based observations, or subjective impressions shared by team members.

Summarize the conversation and categorize the relevant points into the two types.

Transcript:

${transcript}`;

      console.log('🤖 Sending to GPT for analysis...');
      
      const gptRes = await axios.post(
        `${config.openai.apiUrl}/chat/completions`,
        {
          model: 'gpt-4o-mini', // 使用较快的模型处理实时转录
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,  // 较低的温度使输出更一致
          max_tokens: 500,   // 限制响应长度
        },
        {
          headers: {
            Authorization: `Bearer ${config.openai.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30秒超时
        }
      );

      // 检查GPT响应
      if (!gptRes.data?.choices?.[0]?.message?.content) {
        console.warn('⚠️ GPT returned empty response');
        return res.status(200).json({
          transcript,
          summary: 'Unable to generate summary',
        });
      }

      const summary = gptRes.data.choices[0].message.content;
      console.log('✅ GPT analysis complete');

      // ========== Step 3: 清理临时文件 ==========
      try {
        fs.unlinkSync(rawFile.filepath);
        console.log('🗑️ Temporary file cleaned up');
      } catch (cleanupErr) {
        console.warn('Failed to clean up temp file:', cleanupErr.message);
      }

      // ========== Step 4: 返回结果 ==========
      return res.status(200).json({
        success: true,
        transcript,
        summary,
        metadata: {
          audioSize: rawFile.size,
          transcriptLength: transcript.length,
          processedAt: new Date().toISOString(),
        }
      });
      
    } catch (err) {
      console.error('❌ Error during processing:', err?.response?.data || err.message);
      
      // 清理临时文件
      try {
        fs.unlinkSync(rawFile.filepath);
      } catch (cleanupErr) {
        // 忽略清理错误
      }
      
      // 根据错误类型返回不同的响应
      if (err.response?.status === 401) {
        return res.status(500).json({
          error: 'Authentication failed',
          detail: 'Invalid or missing API key'
        });
      }
      
      if (err.response?.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          detail: 'Too many requests, please try again later'
        });
      }
      
      // 在开发环境返回详细错误
      if (config.isDevelopment) {
        return res.status(500).json({
          error: 'Processing failed',
          detail: err?.response?.data || err.message,
          stack: err.stack
        });
      }
      
      // 生产环境返回通用错误
      return res.status(500).json({
        error: 'Processing failed',
        detail: 'An error occurred while processing the audio'
      });
    }
  });
}

// ========== 注释掉的 AssemblyAI 代码说明 ==========
/*
您的代码中有注释掉的 AssemblyAI 实现，这是另一种音频处理方案：

AssemblyAI 优势：
1. 支持说话人分离（speaker diarization）- 可以识别不同的说话人
2. 更准确的长音频转录
3. 支持多种语言自动检测

如果将来需要说话人分离功能，可以：
1. 在 Vercel 添加 ASSEMBLYAI_API_KEY
2. 在 config.js 添加 AssemblyAI 配置
3. 启用注释的代码

当前使用 OpenAI Whisper 的原因：
1. 统一使用 OpenAI 服务，减少依赖
2. Whisper 对短音频（30秒片段）效果很好
3. 成本更低，集成更简单
*/







// // /api/analyze.js  —— AssemblyAI (speaker diarization), no GPT
// import { IncomingForm } from 'formidable';
// import fs from 'fs';
// import axios from 'axios';

// export const config = { api: { bodyParser: false } };

// // AssemblyAI endpoints
// const AAI_KEY = process.env.ASSEMBLYAI_API_KEY;
// const AAI_UPLOAD = 'https://api.assemblyai.com/v2/upload';
// const AAI_TRANSCRIPT = 'https://api.assemblyai.com/v2/transcript';

// export default async function handler(req, res) {
//   if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
//   if (!AAI_KEY) return res.status(500).json({ error: 'Missing ASSEMBLYAI_API_KEY' });

//   const form = new IncomingForm({ uploadDir: '/tmp', keepExtensions: true });

//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       console.error('❌ Form parse error:', err);
//       return res.status(500).json({ error: 'Form parse error', detail: err.message });
//     }

//     const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;
//     if (!rawFile?.filepath) return res.status(400).json({ error: 'Audio file is missing' });

//     try {
//       // 1) Upload audio bytes to AssemblyAI
//       const uploadRes = await axios.post(
//         AAI_UPLOAD,
//         fs.createReadStream(rawFile.filepath),
//         {
//           headers: { authorization: AAI_KEY, 'content-type': 'application/octet-stream' },
//           maxContentLength: Infinity,
//           maxBodyLength: Infinity,
//           timeout: 60_000
//         }
//       );

//       // 2) Create transcript with speaker labels
//       const createRes = await axios.post(
//         AAI_TRANSCRIPT,
//         {
//           audio_url: uploadRes.data.upload_url,
//           speaker_labels: true,      // 👈 关键：开启说话人分离
//           punctuate: true,
//           format_text: true,
//           // language_code: 'en_us'   // 可选
//         },
//         { headers: { authorization: AAI_KEY }, timeout: 30_000 }
//       );

//       const jobId = createRes.data.id;

//       // 3) Poll until completed
//       const tr = await pollAAI(jobId);

//       // 4) Build utterances + labeled transcript
//       const utterances = normalizeUtterances(tr?.utterances || []);
//       const transcript = utterances.length
//         ? utterances.map(u => `${u.speaker_label}: ${u.text}`).join('\n')
//         : (tr?.text || '');

//       return res.status(200).json({
//         provider: 'assemblyai',
//         duration_sec: tr?.audio_duration || null,
//         transcript,
//         utterances
//       });

//     } catch (e) {
//       const detail = e?.response?.data || e?.message || String(e);
//       console.error('🔥 analyze error:', detail);
//       return res.status(500).json({ error: 'Processing failed', detail });
//     } finally {
//       try { fs.unlinkSync(rawFile.filepath); } catch {}
//     }
//   });
// }

// // ---- Helpers ----
// async function pollAAI(id) {
//   const headers = { authorization: AAI_KEY };
//   const maxAttempts = 100; // ~150s
//   for (let i = 0; i < maxAttempts; i++) {
//     await sleep(1500);
//     try {
//       const r = await axios.get(`${AAI_TRANSCRIPT}/${id}`, { headers, timeout: 25_000 });
//       const data = r.data || {};
//       if (data.status === 'completed') return data;
//       if (data.status === 'error') throw new Error(data.error || 'AAI error');
//       // queued / processing -> continue
//     } catch (e) {
//       if (i > 5) console.warn(`Polling #${i} error`, e?.message || e);
//     }
//   }
//   throw new Error('Timeout polling transcript');
// }

// function normalizeUtterances(raw = []) {
//   // AAI 的 speaker 常见为 'A','B','C'...；也可能是数字，统一成 SPEAKER_X
//   return raw.map(u => ({
//     speaker_label: `SPEAKER_${u.speaker ?? 'X'}`,
//     start_ms: Math.round((u.start || 0) * 1000),
//     end_ms: Math.round((u.end || 0) * 1000),
//     text: u.text || ''
//   }));
// }

// function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
