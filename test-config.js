// test-config.js
const config = require('./lib/config');

console.log('Configuration Check:');
console.log('====================');
console.log('OpenAI configured:', !!config.openai.apiKey);
console.log('Supabase URL:', config.supabase.url);
console.log('Supabase Key configured:', !!config.supabase.anonKey);
console.log('Environment:', config.isDevelopment ? 'Development' : 'Production');