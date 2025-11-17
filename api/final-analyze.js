// api/final-analyze.js - 全新文件，处理完整录音
// api/final-analyze.js
import { IncomingForm } from 'formidable';
import fs from 'fs';
import axios from 'axios';
import appConfig from '../lib/config.js';  // 重命名为 appConfig
import { generateFinalPrompt } from '../lib/prompt-system.js';

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

     let formData = {};
  if (fields.form_data) {
    const formDataStr = Array.isArray(fields.form_data) ? fields.form_data[0] : fields.form_data;
    try {
      formData = JSON.parse(formDataStr);
      console.log('📝 Form data received:', Object.keys(formData));
    } catch (e) {
      console.warn('Failed to parse form_data:', e);
      formData = {};
    }
  }

    console.log('📼 Processing complete recording:', {
      size: `${(rawFile.size / 1024 / 1024).toFixed(2)} MB`,
      duration: `${durationMinutes} minutes`,
      session: sessionId,
      hasFormData: Object.keys(formData).length > 0
    });

    try {

      // ✅ Step 1: 获取PDF上下文
  let pdfContext = '';
  if (sessionId) {
    try {
      console.log('📄 Fetching PDF context for session:', sessionId);
      const pdfResponse = await fetch(
        `${appConfig.supabase.url}/rest/v1/pdf_context?session_id=eq.${sessionId}&order=created_at.desc&limit=1`,
        {
          headers: {
            apikey: appConfig.supabase.anonKey,
            Authorization: `Bearer ${appConfig.supabase.anonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (pdfResponse.ok) {
        const pdfData = await pdfResponse.json();
        if (pdfData.length > 0) {
          pdfContext = pdfData[0].pdf_text || '';
          console.log('✅ PDF context loaded, length:', pdfContext.length);
        }
      }
    } catch (pdfErr) {
      console.warn('⚠️ PDF fetch failed, continuing without PDF:', pdfErr.message);
    }
  }

  // ✅ Step 2: 处理previous meeting summary（从formData中获取）
  let lastWeekSummary = formData.previousSummary || '';
  let lastWeekActions = [];
  
  if (lastWeekSummary) {
    console.log('✅ Previous meeting summary loaded from form, length:', lastWeekSummary.length);
    // 尝试从summary中提取action items（可选）
    const actionsMatch = lastWeekSummary.match(/(?:Actions?|Action Items?)[:：]?\s*([^\n]+(?:\n(?![A-Z])[^\n]+)*)/i);
    if (actionsMatch) {
      lastWeekActions = actionsMatch[1].split(/\n/).map(a => a.trim()).filter(a => a);
    }
  }
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
      const finalAnalysis = await generateFinalSummaryWithContext(
  formattedTranscript, 
  sessionId,
  {
    formData,
    pdfContext,
    lastWeekSummary,
    lastWeekActions
  }
);
      // Clean up
      try {
        fs.unlinkSync(rawFile.filepath);
      } catch {}

      // Return results
      // 🔧 检查是否是新的 JSON 格式
      if (finalAnalysis.meeting_summary || finalAnalysis.decision_summary) {
        // 新的 final_comprehensive JSON 格式
        return res.status(200).json({
          success: true,
          fullTranscript: formattedTranscript,
          finalSummary: finalAnalysis,  // 直接返回整个 JSON 对象
          metadata: {
            duration: transcript.audio_duration,
            speakers: countUniqueSpeakers(transcript.utterances),
            words: transcript.words?.length || 0,
            confidence: transcript.confidence
          }
        });
      } else {
        // 旧的文本解析格式（向后兼容）
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
      }

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

async function generateFinalSummaryWithContext(transcript, sessionId, context) {
  const { formData, pdfContext, lastWeekSummary, lastWeekActions } = context;
  
  // 使用prompt-system生成动态prompt
  const promptConfig = {
    // Form配置
    role: formData.role || 'student',
  module: formData.module || 'DE4 ERO',  // ✅ 改：提供默认值
  meetingType: formData.meetingType || 'brainstorming',  // ✅ 改：提供默认值
  projectWeek: formData.projectWeek || 'Week 1',  // ✅ 改：提供默认值
    groupName: formData.groupName || '',
    groupNumber: formData.groupNumber || '',
    
    // 团队和目标
    teamMembers: formData.teamMembers || [],
    goals: formData.meetingGoals || '',
    
    // 分析类型 - 关键！
    analysisType: 'final',
    
    // 上下文
    pdfContext: pdfContext,
    lastWeekSummary: lastWeekSummary,
    lastWeekActions: lastWeekActions
  };
  
  console.log('🎯 Generating final analysis with full context:', {
    hasRole: !!promptConfig.role,
    hasModule: !!promptConfig.module,
    hasPDF: pdfContext.length > 0,
    hasPreviousSummary: lastWeekSummary.length > 0,
    teamSize: promptConfig.teamMembers.length
  });
  
  // 使用prompt-system生成专业的prompt
  const { systemPrompt, userPrompt } = generateFinalPrompt(
    promptConfig,
    transcript
  );
  
  console.log('📝 Generated prompts:', {
    systemLength: systemPrompt.length,
    userLength: userPrompt.length
  });
  
  // 添加决策格式的特殊指示
  const enhancedUserPrompt = userPrompt + `

CRITICAL FORMAT REQUIREMENT for Decisions:
Each decision must be formatted as:
Decision [number]: [what was decided]
Explicit: [facts/data that supported THIS specific decision]
Tacit: [experience/intuition that influenced THIS specific decision]

Example:
Decision 1: We will use React for the frontend
Explicit: React has 200k+ GitHub stars and better performance benchmarks
Tacit: Team has 2 years of positive experience with React in similar projects

Make sure EVERY decision has both explicit and tacit knowledge identified.`;
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: enhancedUserPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,  // 增加以获得更详细的分析
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
    console.log('🤖 GPT Response received, length:', content.length);
    
    // 使用增强的解析函数
    return parseGPTResponseEnhanced(content);
    
  } catch (err) {
    console.error('❌ GPT analysis error:', err.message);
    return {
      summary: 'Failed to generate final summary due to an error.',
      decision: [],
      actions: [],
      explicit: [],
      tacit: [],
      reasoning: '',
      suggestions: []
    };
  }
}

function formatCompleteSpeakerTranscript(transcript) {
  try {
    if (!transcript.utterances || transcript.utterances.length === 0) {
      return transcript.text || 'No transcript available';
    }
    
    // 格式化带有说话人标签的完整transcript
    let formattedText = '';
    let currentSpeaker = '';
    
    transcript.utterances.forEach((utterance, index) => {
      const speaker = utterance.speaker || `Speaker ${String.fromCharCode(65 + (index % 26))}`;
      
      // 只在说话人改变时添加标签
      if (speaker !== currentSpeaker) {
        formattedText += `\n\n${speaker}:\n`;
        currentSpeaker = speaker;
      }
      
      formattedText += utterance.text + ' ';
    });
    
    return formattedText.trim();
    
  } catch (err) {
    console.error('Error formatting transcript:', err);
    return transcript.text || 'Error formatting transcript';
  }
}

function parseGPTResponseEnhanced(content) {
  try {
    // 🔧 首先尝试解析为 JSON（因为 final_comprehensive 格式要求返回 JSON）
    let jsonData = null;

    // 尝试提取 JSON 块（可能被 ```json 包裹）
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/i) || content.match(/```\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content.trim();

    try {
      jsonData = JSON.parse(jsonStr);
      console.log('✅ Parsed GPT response as JSON');

      // 如果成功解析为 JSON，转换为旧的 sections 格式
      if (jsonData.meeting_summary || jsonData.decision_summary) {
        // 这是新的 final_comprehensive 格式
        return jsonData;  // 直接返回 JSON 对象
      }
    } catch (e) {
      console.log('ℹ️ Not a JSON response, falling back to text parsing');
    }

    // 如果不是 JSON，使用正则表达式解析文本格式
    const sections = {};

    // 提取Summary（保持不变）
    const summaryMatch = content.match(/(?:Summary|Overview)[:：]?\s*([^\n]+(?:\n(?!Decision|Reasoning|Suggestions)[^\n]+)*)/i);
    sections.summary = summaryMatch ? summaryMatch[1].trim() : 'No summary available';
    
    // 提取Decisions部分 - 增强解析
    const decisionsSection = content.match(/Decisions?[:：]?\s*((?:Decision\s*\d+.*?(?=Decision\s*\d+|Reasoning:|Suggestions:|$))+)/is);
    
    if (decisionsSection) {
      const decisionsText = decisionsSection[1];
      
      // 解析每个决策及其对应的explicit和tacit
      const decisionPattern = /Decision\s*(\d+)[:：]?\s*([^\n]+)(?:\n+Explicit[:：]?\s*([^\n]+(?:\n(?!Tacit:|Decision\s*\d+|Reasoning:|Suggestions:)[^\n]+)*))?(?:\n+Tacit[:：]?\s*([^\n]+(?:\n(?!Decision\s*\d+|Reasoning:|Suggestions:|Explicit:)[^\n]+)*))?/gi;
      
      const decisions = [];
      const explicits = [];
      const tacits = [];
      
      let match;
      while ((match = decisionPattern.exec(decisionsText)) !== null) {
        const decisionNum = match[1];
        const decisionText = match[2] ? match[2].trim() : '';
        const explicitText = match[3] ? match[3].trim() : 'None identified';
        const tacitText = match[4] ? match[4].trim() : 'None identified';
        
        if (decisionText) {
          // 格式化决策，包含知识
          const formattedDecision = `Decision ${decisionNum}: ${decisionText} (Explicit: ${explicitText} | Tacit: ${tacitText})`;
          decisions.push(formattedDecision);
          
          // 分别收集explicit和tacit
          if (explicitText !== 'None identified') {
            explicits.push(`[D${decisionNum}] ${explicitText}`);
          }
          if (tacitText !== 'None identified') {
            tacits.push(`[D${decisionNum}] ${tacitText}`);
          }
        }
      }
      
      sections.decision = decisions;
      sections.explicit = explicits;
      sections.tacit = tacits;
      
      console.log(`📊 Parsed ${decisions.length} decisions with knowledge`);
      
    } else {
      // 如果没找到新格式，回退到旧的解析方式
      console.log('⚠️ No decisions section found, using fallback parsing');
      sections.decision = [];
      sections.explicit = [];
      sections.tacit = [];
    }
    
    // 提取Actions（保持不变）
    const actionsMatch = content.match(/(?:Actions?|Action Items?|Next Steps?)[:：]?\s*([^\n]+(?:\n(?!Decision|Reasoning|Suggestions)[^\n]+)*)/i);
    sections.actions = actionsMatch ? 
      actionsMatch[1].split(/\n/).map(a => a.replace(/^[-*•\d.)\s]+/, '').trim()).filter(a => a) : [];
    
    // 提取Reasoning（保持不变）
    const reasoningMatch = content.match(/(?:Reasoning|Strategic\s*Implications?)[:：]?\s*([^\n]+(?:\n(?!Suggestions|Decision)[^\n]+)*)/i);
    sections.reasoning = reasoningMatch ? reasoningMatch[1].trim() : '';
    
    // 提取Suggestions（保持不变）
    const suggestionsMatch = content.match(/(?:Suggestions?|Recommendations?)[:：]?\s*([^\n]+(?:\n(?!Decision|$)[^\n]+)*)/i);
    sections.suggestions = suggestionsMatch ? 
      suggestionsMatch[1].split(/\n/).map(s => s.replace(/^[-*•\d.)\s]+/, '').trim()).filter(s => s) : [];
    
    console.log('✅ Enhanced parsing complete:', {
      summaryLength: sections.summary.length,
      decisionsCount: sections.decision.length,
      explicitCount: sections.explicit.length,
      tacitCount: sections.tacit.length,
      hasReasoning: !!sections.reasoning,
      suggestionsCount: sections.suggestions.length
    });
    
    return sections;
    
  } catch (err) {
    console.error('❌ Error in enhanced parsing:', err);
    
    // 回退到原来的parseGPTResponse
    return parseGPTResponse(content);
  }
}

function parseGPTResponse(content) {
  try {
    // 尝试解析GPT响应（可能是文本或JSON格式）
    
    // 首先检查是否是JSON格式
    try {
      const jsonContent = content.trim();
      if (jsonContent.startsWith('{')) {
        const parsed = JSON.parse(jsonContent);
        // 标准化字段名称
        return {
          summary: parsed.summary || parsed.Summary || '',
          decision: parsed.decisions || parsed.decision || parsed.Decisions || [],
          actions: parsed.actions || parsed.Actions || [],
          explicit: parsed.explicit || parsed.explicit_knowledge || parsed.Explicit || [],
          tacit: parsed.tacit || parsed.tacit_knowledge || parsed.Tacit || [],
          reasoning: parsed.reasoning || parsed.Reasoning || '',
          suggestions: parsed.suggestions || parsed.Suggestions || []
        };
      }
    } catch (e) {
      // 不是JSON，继续用文本解析
    }
    
    // 文本格式解析
    const sections = {};
    
    // 提取Summary部分
    const summaryMatch = content.match(/(?:Summary|Overview|总结)[:：]?\s*([^\n]+(?:\n(?![A-Z][a-z]+[:：])[^\n]+)*)/i);
    sections.summary = summaryMatch ? summaryMatch[1].trim() : 'No summary available';
    
    // 提取Decisions（决策）- 注意这里使用decision作为字段名
    const decisionsMatch = content.match(/(?:Decisions?|Key Decisions?)[:：]?\s*([^\n]+(?:\n(?![A-Z][a-z]+[:：])[^\n]+)*)/i);
    if (decisionsMatch) {
      const decisionsText = decisionsMatch[1].trim();
      // 处理列表格式（- 或 * 或数字开头）
      sections.decision = decisionsText
        .split(/\n/)
        .map(d => d.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(d => d.length > 0);
    } else {
      sections.decision = [];
    }
    
    // 提取Actions（如果有）
    const actionsMatch = content.match(/(?:Actions?|Action Items?|Next Steps?)[:：]?\s*([^\n]+(?:\n(?![A-Z][a-z]+[:：])[^\n]+)*)/i);
    if (actionsMatch) {
      const actionsText = actionsMatch[1].trim();
      sections.actions = actionsText
        .split(/\n/)
        .map(a => a.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(a => a.length > 0);
    } else {
      sections.actions = [];
    }
    
    // 提取Explicit Knowledge（显性知识）
    const explicitMatch = content.match(/(?:Explicit\s*Knowledge?|Documented Facts?)[:：]?\s*([^\n]+(?:\n(?![A-Z][a-z]+[:：])[^\n]+)*)/i);
    if (explicitMatch) {
      const explicitText = explicitMatch[1].trim();
      sections.explicit = explicitText
        .split(/\n/)
        .map(e => e.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(e => e.length > 0);
    } else {
      sections.explicit = [];
    }
    
    // 提取Tacit Knowledge（隐性知识）
    const tacitMatch = content.match(/(?:Tacit\s*Knowledge?|Insights?|Experiences?)[:：]?\s*([^\n]+(?:\n(?![A-Z][a-z]+[:：])[^\n]+)*)/i);
    if (tacitMatch) {
      const tacitText = tacitMatch[1].trim();
      sections.tacit = tacitText
        .split(/\n/)
        .map(t => t.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(t => t.length > 0);
    } else {
      sections.tacit = [];
    }
    
    // 提取Reasoning（推理/逻辑）
    const reasoningMatch = content.match(/(?:Reasoning|Strategic\s*Implications?|Logic)[:：]?\s*([^\n]+(?:\n(?![A-Z][a-z]+[:：])[^\n]+)*)/i);
    sections.reasoning = reasoningMatch ? reasoningMatch[1].trim() : '';
    
    // 提取Suggestions（建议）
    const suggestionsMatch = content.match(/(?:Suggestions?|Recommendations?)[:：]?\s*([^\n]+(?:\n(?![A-Z][a-z]+[:：])[^\n]+)*)/i);
    if (suggestionsMatch) {
      const suggestionsText = suggestionsMatch[1].trim();
      sections.suggestions = suggestionsText
        .split(/\n/)
        .map(s => s.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(s => s.length > 0);
    } else {
      sections.suggestions = [];
    }
    
    console.log('✅ Parsed GPT response:', {
      summaryLength: sections.summary.length,
      decisionsCount: sections.decision.length,
      actionsCount: sections.actions.length,
      explicitCount: sections.explicit.length,
      tacitCount: sections.tacit.length,
      hasReasoning: !!sections.reasoning,
      suggestionsCount: sections.suggestions.length
    });
    
    return sections;
    
  } catch (err) {
    console.error('❌ Error parsing GPT response:', err);
    
    // 返回默认结构，确保所有字段都存在
    return {
      summary: content || 'Failed to parse summary',
      decision: [],
      actions: [],
      explicit: [],
      tacit: [],
      reasoning: '',
      suggestions: []
    };
  }
}
function countUniqueSpeakers(utterances) {
  try {
    if (!utterances || !Array.isArray(utterances)) {
      return 0;
    }
    
    const speakers = new Set();
    utterances.forEach(u => {
      if (u.speaker) {
        speakers.add(u.speaker);
      }
    });
    
    return speakers.size || 1; // 至少返回1个说话人
    
  } catch (err) {
    console.error('Error counting speakers:', err);
    return 1;
  }
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}