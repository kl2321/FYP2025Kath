const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// 创建Supabase客户端实例
let supabaseClient = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    if (!config.supabase.url || !config.supabase.anonKey) {
      console.error('Supabase configuration is missing');
      // 返回null而不是抛出错误，让调用者处理
      return null;
    }
    
    supabaseClient = createClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: {
          persistSession: false // API路由不需要持久化session
        }
      }
    );
  }
  
  return supabaseClient;
}

// 导出客户端
module.exports = {
  supabase: getSupabaseClient(),
  getSupabaseClient
};