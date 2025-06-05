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
          model: 'gpt-3.5-turbo',
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
