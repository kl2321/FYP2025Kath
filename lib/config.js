
// lib/config.js - ES Module configuration
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory (needed for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '../.env.local') });

// Configuration object
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    whisperModel: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',
  },
  
  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  
  // Security
  sessionSecret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
  
  // API settings
  api: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    timeout: 60000, // 60 seconds
  }
};

// Validate required configuration
const validateConfig = () => {
  const errors = [];
  
  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is not configured');
  }
  
  if (!config.supabase.url) {
    errors.push('SUPABASE_URL is not configured');
  }
  
  if (!config.supabase.anonKey) {
    errors.push('SUPABASE_ANON_KEY is not configured');
  }
  
  if (errors.length > 0 && config.isDevelopment) {
    console.warn('⚠️ Configuration warnings:');
    errors.forEach(error => console.warn(`  - ${error}`));
  }
  
  return errors.length === 0;
};

// Run validation
validateConfig();

// ES Module default export
export default config;