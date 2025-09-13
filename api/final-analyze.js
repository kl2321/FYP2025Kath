// api/final-analyze.js - 全新文件，处理完整录音
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
    maxFileSize: 200 * 1024 * 1024, // 200MB for longer recordings
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
        config.assemblyai.uploadUrl,
        fs.createReadStream(rawFile.filepath),
        {
          headers: {
            authorization: config.assemblyai.apiKey,
            'content-type': 'application/octet-stream'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 120000 // 2 minutes for large files
        }
      );

      // Step 2: Request comprehensive transcription
      console.log('🎯 Requesting comprehensive transcription with speaker diarization...');
      const transcriptRes = await axios.post(
        config.assemblyai.transcriptUrl,
        {
          audio_url: uploadRes.data.upload_url,
          speaker_labels: true,
          punctuate: true,
          format_text: true,
          // language_code: 'en_us', // Optional: specify language
        },
        {
          headers: { authorization: config.assemblyai.apiKey },
          timeout: 30000
        }
      );

      const transcriptId = transcriptRes.data.id;
      console.log('📝 Final transcript job created:', transcriptId);

      // Step 3: Poll for completion (extended for full recording)
      const transcript = await pollForTranscript(transcriptId, true);
      
      // Step 4: Format complete transcript with consistent speaker labels
      const formattedTranscript = formatCompleteSpeakerTranscript(transcript);
      
      // Step 5: Generate comprehensive final summary using GPT
      const finalAnalysis = await generateFinalSummary(
        formattedTranscript,
        sessionId
      );

      // Clean up
      try {
        fs.unlinkSync(rawFile.filepath);
      } catch {}

      // Return comprehensive results
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
      console.error('❌ Final processing error:', err);
      
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

// Extended polling for longer recordings
async function pollForTranscript(transcriptId, isLongRecording = false) {
  const maxAttempts = isLongRecording ? 200 : 60; // Up to 5 minutes for long recordings
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

// Format complete transcript with stable speaker mapping
function formatCompleteSpeakerTranscript(transcript) {
  if (!transcript.utterances || transcript.utterances.length === 0) {
    return transcript.text || '';
  }
  
  // Create stable speaker mapping for entire conversation
  const speakerMap = new Map();
  const speakerFirstAppearance = new Map();
  
  // First pass: identify all unique speakers and their first appearance
  transcript.utterances.forEach((utterance, index) => {
    if (!speakerFirstAppearance.has(utterance.speaker)) {
      speakerFirstAppearance.set(utterance.speaker, index);
    }
  });
  
  // Sort speakers by first appearance and assign letters
  const sortedSpeakers = Array.from(speakerFirstAppearance.entries())
    .sort((a, b) => a[1] - b[1]);
  
  sortedSpeakers.forEach(([speaker, _], index) => {
    speakerMap.set(speaker, String.fromCharCode(65 + index));
  });
  
  // Format transcript with consistent speaker labels
  return transcript.utterances
    .map(utterance => {
      const speaker = speakerMap.get(utterance.speaker);
      return `Speaker ${speaker}: ${utterance.text}`;
    })
    .join('\n\n');
}

// Generate comprehensive final summary using GPT
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
      `${config.openai.apiUrl}/chat/completions`,
      {
        model: config.openai.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${config.openai.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    
    // Parse structured response (similar to summarize.js format)
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

// Parse GPT response (matching summarize.js format)
function parseGPTResponse(content) {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || '',
      decision: parsed.decision || [],
      explicit: parsed.explicit || [],
      tacit: parsed.tacit || [],
      reasoning: parsed.reasoning || '',
      suggestions: parsed.suggestions || []
    };
  } catch {
    // Fallback to text parsing
    return {
      summary: content,
      decision: [],
      explicit: [],
      tacit: [],
      reasoning: '',
      suggestions: []
    };
  }
}

function countUniqueSpeakers(utterances) {
  if (!utterances || utterances.length === 0) return 0;
  const speakers = new Set(utterances.map(u => u.speaker));
  return speakers.size;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}