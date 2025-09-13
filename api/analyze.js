// api/analyze.js - 完全替换为AssemblyAI版本
import { IncomingForm } from 'formidable';
import fs from 'fs';
import axios from 'axios';
import config from '../lib/config.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({
    uploadDir: '/tmp',
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('⌛ Form parse error:', err);
      return res.status(500).json({ error: 'Form parse error', detail: err.message });
    }

    const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!rawFile?.filepath) {
      return res.status(400).json({ error: 'Audio file is missing' });
    }

    console.log('📁 Received audio file:', {
      name: rawFile.originalFilename,
      size: rawFile.size,
      type: rawFile.mimetype
    });

    try {
      // Step 1: Upload to AssemblyAI
      console.log('📤 Uploading to AssemblyAI...');
      const uploadRes = await axios.post(
        config.assemblyai.uploadUrl,
        fs.createReadStream(rawFile.filepath),
        {
          headers: {
            authorization: config.assemblyai.apiKey,
            'content-type': 'application/octet-stream'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 60000
        }
      );

      const audioUrl = uploadRes.data.upload_url;
      console.log('✅ Audio uploaded');

      // Step 2: Request transcription with speaker labels
      console.log('🎯 Requesting transcription...');
      const transcriptRes = await axios.post(
        config.assemblyai.transcriptUrl,
        {
          audio_url: audioUrl,
          speaker_labels: true,
          punctuate: true,
          format_text: true,
        },
        {
          headers: { authorization: config.assemblyai.apiKey },
          timeout: 30000
        }
      );

      const transcriptId = transcriptRes.data.id;
      console.log('📝 Transcript job created:', transcriptId);

      // Step 3: Poll for completion
      const transcript = await pollForTranscript(transcriptId);
      
      // Step 4: Format with speaker labels
      const formattedTranscript = formatSpeakerTranscript(transcript);
      
      console.log('✅ Transcription complete');

      // Clean up
      try {
        fs.unlinkSync(rawFile.filepath);
      } catch {}

      return res.status(200).json({
        success: true,
        transcript: formattedTranscript,
        metadata: {
          audioSize: rawFile.size,
          duration: transcript.audio_duration,
          speakers: countSpeakers(transcript.utterances),
          processedAt: new Date().toISOString(),
        }
      });

    } catch (err) {
      console.error('⌛ Error:', err?.response?.data || err.message);
      
      try {
        fs.unlinkSync(rawFile.filepath);
      } catch {}
      
      return res.status(500).json({
        error: 'Processing failed',
        detail: err?.response?.data || err.message
      });
    }
  });
}

async function pollForTranscript(transcriptId) {
  const maxAttempts = 60;
  const pollInterval = 1500;
  
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(pollInterval);
    
    try {
      const res = await axios.get(
        `${config.assemblyai.transcriptUrl}/${transcriptId}`,
        {
          headers: { authorization: config.assemblyai.apiKey },
          timeout: 10000
        }
      );
      
      const { status, error } = res.data;
      
      if (status === 'completed') {
        return res.data;
      }
      
      if (status === 'error') {
        throw new Error(error || 'Transcription failed');
      }
      
    } catch (err) {
      if (i > 5) {
        console.warn(`Polling attempt ${i} failed:`, err.message);
      }
    }
  }
  
  throw new Error('Transcript polling timeout');
}

function formatSpeakerTranscript(transcript) {
  if (!transcript.utterances || transcript.utterances.length === 0) {
    return transcript.text || '';
  }
  
  const speakerMap = new Map();
  let speakerIndex = 0;
  
  return transcript.utterances
    .map(utterance => {
      let speakerLabel = utterance.speaker;
      
      if (!speakerMap.has(speakerLabel)) {
        speakerMap.set(speakerLabel, String.fromCharCode(65 + speakerIndex));
        speakerIndex++;
      }
      
      const speaker = speakerMap.get(speakerLabel);
      return `Speaker ${speaker}: ${utterance.text}`;
    })
    .join('\n');
}

function countSpeakers(utterances) {
  if (!utterances || utterances.length === 0) return 0;
  const speakers = new Set(utterances.map(u => u.speaker));
  return speakers.size;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// // api/analyze.js
// // 音频处理中心 - 接收音频块，转录并分析
// // api/analyze.js - Fixed version with proper ES module imports
// import { IncomingForm } from 'formidable';
// import fs from 'fs';
// import axios from 'axios';
// import FormData from 'form-data';

// // Use ES module import for config
// import config from '../lib/config.js';  // Note: .js extension is required for ES modules

// // Vercel configuration for file upload handling
// export const apiConfig = {
//   api: {
//     bodyParser: false,  // Disable default body parsing for file uploads
//   },
// };

// export default async function handler(req, res) {
//   // Add CORS headers
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
//   // Handle OPTIONS request for CORS preflight
//   if (req.method === 'OPTIONS') {
//     return res.status(200).end();
//   }
  
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   // Check OpenAI configuration
//   if (!config.openai.apiKey) {
//     console.error('OpenAI API key not configured');
//     return res.status(500).json({ error: 'Server configuration error: Missing OpenAI API key' });
//   }

//   // Create form parser for file uploads
//   const form = new IncomingForm({
//     uploadDir: '/tmp',        // Vercel's temp directory
//     keepExtensions: true,     // Keep file extensions
//     maxFileSize: 50 * 1024 * 1024,  // 50MB limit
//   });

//   // Parse uploaded form data
//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       console.error('❌ Form parse error:', err);
//       return res.status(500).json({ 
//         error: 'Form parse error', 
//         detail: config.isDevelopment ? err.message : undefined 
//       });
//     }

//     // Get uploaded audio file
//     const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;
//     if (!rawFile || !rawFile.filepath) {
//       return res.status(400).json({ error: 'Audio file is missing' });
//     }

//     console.log('📁 Received audio file:', {
//       name: rawFile.originalFilename,
//       size: rawFile.size,
//       type: rawFile.mimetype
//     });

//     try {
//       // ========== Step 1: Speech to Text (Whisper) ==========
//       const formData = new FormData();
//       formData.append('file', fs.createReadStream(rawFile.filepath));
//       formData.append('model', config.openai.whisperModel || 'whisper-1');
      
//       // Optional: Add language hint
//       // formData.append('language', 'en'); // or 'zh' for Chinese

//       console.log('🔤 Sending to Whisper API...');
      
//       const whisperRes = await axios.post(
//         `${config.openai.apiUrl}/audio/transcriptions`,
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${config.openai.apiKey}`,
//             ...formData.getHeaders(), // Include multipart boundary
//           },
//           timeout: 60000, // 60 seconds timeout
//         }
//       );

//       const transcript = whisperRes.data.text || '';
//       console.log('✅ Whisper transcript received, length:', transcript.length);

//       // Handle empty transcripts
//       if (!transcript || transcript.trim() === '') {
//         console.warn('⚠️ Empty transcript from Whisper');
//         return res.status(200).json({
//           success: true,
//           transcript: '[No speech detected in audio]',
//           summary: 'No content to analyze',
//           metadata: {
//             audioSize: rawFile.size,
//             transcriptLength: 0,
//             processedAt: new Date().toISOString(),
//           }
//         });
//       }

//       // ========== Step 2: Text Analysis (GPT) ==========
      
//       // Build analysis prompt
//       const systemPrompt = `You are a meeting assistant analyzing team discussions. 
//       Focus on project-related content and collaboration.
//       Categorize insights into explicit knowledge (documented facts) and tacit knowledge (experiential insights).`;
      
//       const userPrompt = `Please summarize the following meeting transcript and split the content into explicit and tacit knowledge.

// Only include conversation related to the team's project work or collaboration.

// - Explicit knowledge refers to documented, factual information such as data, specifications, or user feedback.
// - Tacit knowledge refers to intuitive insights, experience-based observations, or subjective impressions shared by team members.

// Summarize the conversation and categorize the relevant points into the two types.

// Transcript:

// ${transcript}`;

//       console.log('🤖 Sending to GPT for analysis...');
      
//       const gptRes = await axios.post(
//         `${config.openai.apiUrl}/chat/completions`,
//         {
//           model: config.openai.model || 'gpt-4o-mini', // Use configured model
//           messages: [
//             { role: 'system', content: systemPrompt },
//             { role: 'user', content: userPrompt }
//           ],
//           temperature: 0.3,  // Lower temperature for more consistent output
//           max_tokens: 500,   // Limit response length
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${config.openai.apiKey}`,
//             'Content-Type': 'application/json',
//           },
//           timeout: 30000, // 30 seconds timeout
//         }
//       );

//       // Check GPT response
//       if (!gptRes.data?.choices?.[0]?.message?.content) {
//         console.warn('⚠️ GPT returned empty response');
//         return res.status(200).json({
//           success: true,
//           transcript,
//           summary: 'Unable to generate summary',
//           metadata: {
//             audioSize: rawFile.size,
//             transcriptLength: transcript.length,
//             processedAt: new Date().toISOString(),
//           }
//         });
//       }

//       const summary = gptRes.data.choices[0].message.content;
//       console.log('✅ GPT analysis complete');

//       // ========== Step 3: Clean up temporary file ==========
//       try {
//         fs.unlinkSync(rawFile.filepath);
//         console.log('🗑️ Temporary file cleaned up');
//       } catch (cleanupErr) {
//         console.warn('Failed to clean up temp file:', cleanupErr.message);
//       }

//       // ========== Step 4: Return results ==========
//       return res.status(200).json({
//         success: true,
//         transcript,
//         summary,
//         metadata: {
//           audioSize: rawFile.size,
//           transcriptLength: transcript.length,
//           processedAt: new Date().toISOString(),
//         }
//       });
      
//     } catch (err) {
//       console.error('❌ Error during processing:', err?.response?.data || err.message);
      
//       // Clean up temp file on error
//       try {
//         fs.unlinkSync(rawFile.filepath);
//       } catch (cleanupErr) {
//         // Ignore cleanup errors
//       }
      
//       // Return different responses based on error type
//       if (err.response?.status === 401) {
//         return res.status(500).json({
//           error: 'Authentication failed',
//           detail: 'Invalid or missing API key'
//         });
//       }
      
//       if (err.response?.status === 429) {
//         return res.status(429).json({
//           error: 'Rate limit exceeded',
//           detail: 'Too many requests, please try again later'
//         });
//       }
      
//       // Return detailed error in development
//       if (config.isDevelopment) {
//         return res.status(500).json({
//           error: 'Processing failed',
//           detail: err?.response?.data || err.message,
//           stack: err.stack
//         });
//       }
      
//       // Return generic error in production
//       return res.status(500).json({
//         error: 'Processing failed',
//         detail: 'An error occurred while processing the audio'
//       });
//     }
//   });
// }

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
