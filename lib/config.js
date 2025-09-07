
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'SUPABASE_URL', 
  'SUPABASE_ANON_KEY'
];

// 检查环境变量是否存在
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: Missing environment variable: ${envVar}`);
    // 在生产环境中这是严重错误
    if (process.env.NODE_ENV === 'production') {
      console.error(`Critical: ${envVar} is required in production`);
    }
  }
}

// 导出配置对象
const config = {
  // OpenAI配置
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    apiUrl: 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    whisperModel: 'whisper-1'
  },
  
  // Supabase配置
  supabase: {
    url: process.env.SUPABASE_URL || 'https://cwhekhkphzcovivgqezd.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aGVraGtwaHpjb3ZpdmdxZXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NjgyNjgsImV4cCI6MjA2MzU0NDI2OH0.hmZt6bFgKSWel6HiXfEjmm85P_j8fcsUo71hVWmkF2A'
  },
  
  // 安全配置（可选，如果需要的话）
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'default-dev-secret-change-in-production',
    allowedOrigins: [
      'https://www.figma.com',
      'https://figma.com',
      'null' // Figma desktop
    ]
  },
  
  // API配置
  api: {
    baseUrl: process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'https://fyp-2025-kath.vercel.app'
  },
  
  // 环境检测
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

// 冻结配置对象，防止运行时修改
Object.freeze(config);

module.exports = config;