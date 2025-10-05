
import config from '../lib/config.js';
import { generateRealtimePrompt  } from '../lib/prompt-system.js';
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
// Extract enhanced parameters
  const { 
    text, 
    avoid, 
    session_id,
    // NEW: Prompt System parameters
    form_data = {}
  } = body;

  if (!text) {
  return res.status(400).json({ error: 'Missing text to summarize' });
}



// Extract form data for prompt generation
const {
  role = 'student',
  module = 'DE4 ERO',           // ← 改为有效的默认值
  meetingType = 'brainstorming', // ← 改为有效的默认值
  teamMembers = [],
  meetingGoals = '',
  projectWeek = '',
  groupName = '',
  groupNumber = ''
} = form_data  || {};

const validatedConfig = {
  role: role || 'student',
  module: module || 'DE4 ERO',
  meetingType: meetingType || 'brainstorming',
  teamMembers: Array.isArray(teamMembers) ? teamMembers : [],
  meetingGoals: meetingGoals || '',
  projectWeek: projectWeek || '',
  groupName: groupName || '',
  groupNumber: groupNumber || ''
};

console.log('🎯 Real-time analysis config:', {
  role: validatedConfig.role,
  module: validatedConfig.module,
  meetingType: validatedConfig.meetingType,
  projectWeek: validatedConfig.projectWeek,
  teamSize: validatedConfig.teamMembers.length,
  hasPreviousSummary: !!avoid
});

// 警告信息（如果使用了默认值）
if (!form_data || !form_data.module || !form_data.meetingType) {
  console.warn('⚠️ Using default values for missing form fields');
}
// 新增：从Supabase获取PDF内容
let context_pdf = '';

if (session_id) {
    try {
      console.log('获取PDF上下文 for session:', session_id);
      
      // 使用集中配置的Supabase URL和密钥
      const pdfResponse = await fetch(
        `${config.supabase.url}/rest/v1/pdf_context?session_id=eq.${session_id}&order=created_at.desc&limit=1`, 
        {
          headers: {
            apikey: config.supabase.anonKey,
            Authorization: `Bearer ${config.supabase.anonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
    
    if (pdfResponse.ok) {
      const pdfData = await pdfResponse.json();
      if (pdfData.length > 0) {
        context_pdf = pdfData[0].pdf_text || '';
        console.log('✅ PDF context loaded, length:', context_pdf.length);
      }
    }
  } catch (pdfErr) {
    console.warn(' PDF fetch failed, continuing without PDF', pdfErr.message);
  }
}

  try {
    // 🔥 NEW: Generate dynamic prompts using Prompt System
    const promptConfig = {
      role: validatedConfig.role,
      module: validatedConfig.module,
      meetingType: validatedConfig.meetingType,
      projectWeek: validatedConfig.projectWeek,
      groupName,
      groupNumber,
      goals: meetingGoals,
      teamMembers: teamMembers.filter(member => member && member.trim()),
      analysisType: 'realtime',
      previousSummary: avoid || '',
      pdfContext: context_pdf
      };
      // Generate dynamic prompts using prompt-system
    const { systemPrompt, userPrompt } = generateRealtimePrompt(
      promptConfig,
      text  // transcript
    );

console.log('📝 Generated prompts:');
console.log('System length:', systemPrompt.length, 'chars');
console.log('User length:', userPrompt.length, 'chars');
// Call OpenAI API
    const openaiRes = await fetch(`${config.openai.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",  
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
         temperature: 0.7,
         response_format: { type: "json_object" }
        // max_tokens: 1000
      })
    });

    const data = await openaiRes.json();
    //  safety check
    if (!data?.choices?.[0]?.message?.content) {
      console.warn('🟨 OpenAI returned empty response');
      return res.status(200).json({ 
        decisions: [],
        analysisTime: new Date().toISOString(),
        error: 'Empty response from AI'
      });
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
        .replace(/```$/, '')
         .trim();
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error("❌ Failed to parse GPT output:", e);
      console.error("Raw content:", data.choices[0].message.content);

       return res.status(200).json({ 
        decisions: [],
        transcript: text,
        analysisTime: new Date().toISOString(),
        error: 'Failed to parse AI response',
        raw_response: config.isDevelopment ? data.choices[0].message.content : undefined
      });
      
    }

    // Return real-time decision analysis results
    res.status(200).json({ 
      // Primary response: decisions array
      decisions: parsed.decisions || [],
      analysisTime: new Date().toISOString(),
      
      // Include transcript for reference
      transcript: text,
      
      // Backward compatibility fields (can be removed if frontend is updated)
      summary: parsed.decisions?.map(d => d.decision).join('; ') || '',
      decision: parsed.decisions?.map(d => d.decision) || [],
      explicit: parsed.decisions?.flatMap(d => d.explicit_knowledge || []) || [],
      tacit: parsed.decisions?.flatMap(d => d.tacit_knowledge || []) || [],
      reasoning: '',
      suggestions: [],
      
      // Metadata for debugging
      prompt_metadata: config.isDevelopment ? {
        role,
        module,
        meetingType,
        projectWeek,
        groupName,
        groupNumber,
        analysis_type: 'realtime',
        pdf_context_length: pdfContext.length,
        previous_summary_length: (avoid || '').length
      } : undefined
    });

  } catch (err) {
    console.error("❌ Real-time analysis error:", err);
    
    // Return detailed error in development
    if (config.isDevelopment) {
      return res.status(500).json({ 
        error: 'Analysis failed',
        detail: err.message,
        stack: err.stack,
        decisions: []
      });
    }
    

    
    
  // Return simple error in production
    return res.status(500).json({ 
      error: 'Analysis failed',
      decisions: [],
      analysisTime: new Date().toISOString()
    });


  }
}
