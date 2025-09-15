// api/final-analyze.js - 全新文件，处理完整录音
// api/final-analyze.js
import { IncomingForm } from 'formidable';
import fs from 'fs';
import axios from 'axios';
import appConfig from '../lib/config.js';  // 重命名为 appConfig

export const config = { api: { bodyParser: false } };  // 保持 Next.js API 配置

// 定义常量
const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_UPLOAD_URL = 'https://api.assemblyai.com/v2/upload';
const ASSEMBLYAI_TRANSCRIPT_URL = 'https://api.assemblyai.com/v2/transcript';
const OPENAI_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({
    uploadDir: '/tmp',
    keepExtensions: true,
    maxFileSize: 200 * 1024 * 1024,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parse error:', err);
      return res.status(500).json({ error: 'Form parse error', detail: err.message });
    }

    const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!rawFile?.filepath) {
      return res.status(400).json({ error: 'Audio file is missing' });
    }

    const sessionId = Array.isArray(fields.session_id) ? fields.session_id[0] : fields.session_id;
    const durationMinutes = parseInt(Array.isArray(fields.duration_minutes) ? fields.duration_minutes[0] : fields.duration_minutes) || 0;

    console.log('📼 Processing complete recording:', {
      size: `${(rawFile.size / 1024 / 1024).toFixed(2)} MB`,
      duration: `${durationMinutes} minutes`,
      session: sessionId
    });

    try {
      // Step 1: Upload to AssemblyAI
      console.log('📤 Uploading complete recording to AssemblyAI...');
      const uploadRes = await axios.post(
        ASSEMBLYAI_UPLOAD_URL,
        fs.createReadStream(rawFile.filepath),
        {
          headers: {
            authorization: ASSEMBLYAI_KEY,
            'content-type': 'application/octet-stream'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 120000
        }
      );

      // Step 2: Request transcription
      console.log('🎯 Requesting comprehensive transcription...');
      const transcriptRes = await axios.post(
        ASSEMBLYAI_TRANSCRIPT_URL,
        {
          audio_url: uploadRes.data.upload_url,
          speaker_labels: true,
          punctuate: true,
          format_text: true,
        },
        {
          headers: { authorization: ASSEMBLYAI_KEY },
          timeout: 30000
        }
      );

      const transcriptId = transcriptRes.data.id;
      console.log('📝 Final transcript job created:', transcriptId);

      // Step 3: Poll for completion
      const transcript = await pollForTranscript(transcriptId, true);
      
      // Step 4: Format transcript
      const formattedTranscript = formatCompleteSpeakerTranscript(transcript);
      
      // Step 5: Generate final summary
      const finalAnalysis = await generateFinalSummary(formattedTranscript, sessionId);

      // Clean up
      try {
        fs.unlinkSync(rawFile.filepath);
      } catch {}

      // Return results
      return res.status(200).json({
        success: true,
        fullTranscript: formattedTranscript,
        finalSummary: finalAnalysis.summary,
        decisions: finalAnalysis.decision,
        actions: finalAnalysis.actions,
        explicit: finalAnalysis.explicit,
        tacit: finalAnalysis.tacit,
        reasoning: finalAnalysis.reasoning,
        suggestions: finalAnalysis.suggestions,
        metadata: {
          duration: transcript.audio_duration,
          speakers: countUniqueSpeakers(transcript.utterances),
          words: transcript.words?.length || 0,
          confidence: transcript.confidence
        }
      });

    } catch (err) {
      console.error('❌ Final processing error:', err?.response?.data || err.message);
      
      try {
        fs.unlinkSync(rawFile.filepath);
      } catch {}
      
      return res.status(500).json({
        error: 'Final processing failed',
        detail: err?.response?.data || err.message
      });
    }
  });
}

// Modified pollForTranscript - no config parameter needed
async function pollForTranscript(transcriptId, isLongRecording = false) {
  const maxAttempts = isLongRecording ? 200 : 60;
  const pollInterval = 1500;
  
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(pollInterval);
    
    try {
      const res = await axios.get(
        `${ASSEMBLYAI_TRANSCRIPT_URL}/${transcriptId}`,
        {
          headers: { authorization: ASSEMBLYAI_KEY },
          timeout: 10000
        }
      );
      
      const { status, error } = res.data;
      
      if (status === 'completed') {
        console.log(`✅ Transcription completed after ${(i * pollInterval / 1000).toFixed(0)}s`);
        return res.data;
      }
      
      if (status === 'error') {
        throw new Error(error || 'Transcription failed');
      }
      
      if (i % 20 === 0) {
        console.log(`⏳ Still processing... (${(i * pollInterval / 1000).toFixed(0)}s)`);
      }
      
    } catch (err) {
      if (i > 10) {
        console.warn(`Polling attempt ${i} failed:`, err.message);
      }
    }
  }
  
  throw new Error('Transcript polling timeout');
}

// Modified generateFinalSummary - use environment variable
async function generateFinalSummary(transcript, sessionId) {
  const systemPrompt = `You are an expert meeting analyst. Analyze this complete meeting transcript with speaker labels and provide a comprehensive summary.`;

  const userPrompt = `Please analyze this complete meeting transcript and provide a comprehensive summary.
  
Split the content into:
1. Summary: Overall meeting summary
2. Decisions: Key decisions made
3. Explicit Knowledge: Documented facts, data, specifications
4. Tacit Knowledge: Insights, experiences, intuitions
5. Reasoning: Strategic implications
6. Suggestions: Recommendations for next steps

Complete Transcript with Speaker Labels:
${transcript}`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    return parseGPTResponse(content);
    
  } catch (err) {
    console.error('GPT analysis failed:', err);
    return {
      summary: 'Failed to generate final summary',
      decision: [],
      actions: [],
      explicit: [],
      tacit: [],
      reasoning: '',
      suggestions: []
    };
  }
}

// Keep other functions unchanged
function formatCompleteSpeakerTranscript(transcript) {
  // ... keep as is
}

function parseGPTResponse(content) {
  // ... keep as is
}

function countUniqueSpeakers(utterances) {
  // ... keep as is
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}