import { IncomingForm } from 'formidable';
import fs from 'fs';
import axios from 'axios';
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

  const form = new IncomingForm({
    uploadDir: '/tmp',
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parse error:', err);
      return res.status(500).json({ error: 'Form parse error', detail: err.message });
    }

    const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!rawFile || !rawFile.filepath) {
      return res.status(400).json({ error: 'Audio file is missing' });
    }

    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) {
      return res.status(500).json({ error: 'Missing OpenAI API key' });
    }

    try {
      // ✅ Whisper API with axios + form-data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(rawFile.filepath));
      formData.append('model', 'whisper-1');

      console.log('📤 Sending to Whisper...');
      const whisperRes = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            Authorization: `Bearer ${openAIKey}`,
            ...formData.getHeaders(), // 👈 包含 multipart boundary
          },
        }
      );

      const transcript = whisperRes.data.text;
      console.log('✅ Whisper transcript:', transcript);

      // 🔁 GPT summary
      const gptRes = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          //messages: [{ role: 'user', content: `please summarize the following and split into explicit and tacit knowledge:\n\n${transcript}` }],
          messages: [{
            role: 'user',
            content: `Please summarize the following meeting transcript and split the content into explicit and tacit knowledge. Only include conversation related to the team's project work or collaboration.\n\n- Explicit knowledge refers to documented, factual information such as data, specifications, or user feedback.\n- Tacit knowledge refers to intuitive insights, experience-based observations, or subjective impressions shared by team members.\n\nSummarize the conversation and categorize the relevant points into the two types.\n\nTranscript:\n\n${transcript}`
          }]
        },
        {
          headers: {
            Authorization: `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return res.status(200).json({
        transcript,
        summary: gptRes.data.choices[0].message.content,
      });
    } catch (err) {
      console.error(' Error during processing:', err?.response?.data || err.message);
      return res.status(500).json({
        error: 'Processing failed',
        detail: err?.response?.data || err.message,
      });
    }
  });
}


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
