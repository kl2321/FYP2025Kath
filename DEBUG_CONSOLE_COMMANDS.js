// ========================================
// 调试命令 - 直接在 UI Panel Console 中运行
// ========================================

// 1️⃣ 检查当前的轮询状态
console.log('Current session ID:', recordingSessionId);
console.log('Polling interval:', pollInterval);
console.log('Is recording:', isRecording);
console.log('Form data:', formData);

// 2️⃣ 手动查询 Supabase（替换你的 session ID）
fetch('https://fyp-2025-kath.vercel.app/api/get?session=1761097717573')
  .then(r => r.json())
  .then(data => {
    console.log('🔍 Supabase 数据:', data);
    console.log('  - is_intermediate:', data.is_intermediate);
    console.log('  - segment_number:', data.segment_number);
    console.log('  - summary:', data.summary?.substring(0, 50) + '...');
    console.log('  - decisions:', data.decision);
  })
  .catch(err => console.error('查询失败:', err));

// 3️⃣ 手动触发 segment 检测（测试 code.ts 是否能接收）
parent.postMessage({
  pluginMessage: {
    type: 'update-segment-summary',
    data: {
      segmentNumber: 999,
      summary: 'Manual test from console',
      decisions: ['Test decision 1', 'Test decision 2'],
      explicit: ['Test explicit knowledge'],
      tacit: ['Test tacit knowledge'],
      reasoning: 'Test reasoning',
      suggestions: ['Test suggestion'],
      durationMinutes: 5,
      speakerCount: 2
    }
  }
}, '*');
console.log('✅ 已发送测试消息，检查 Figma Console 和 Canvas');

// 4️⃣ 检查轮询函数是否是新版本
if (window.startPolling) {
  console.log('✅ startPolling 函数存在');
  console.log(window.startPolling.toString().includes('is_intermediate')
    ? '✅ 使用新版本（检测 is_intermediate）'
    : '❌ 使用旧版本（检测 transcript）'
  );
} else {
  console.log('❌ startPolling 函数不存在');
}

// 5️⃣ 添加临时的 fetch 拦截器（查看所有 API 请求）
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('/api/get')) {
    console.log('🌐 API 请求:', args[0]);
    return originalFetch.apply(this, args).then(response => {
      return response.clone().json().then(data => {
        console.log('📥 API 响应:', data);
        return new Response(JSON.stringify(data), response);
      });
    });
  }
  return originalFetch.apply(this, args);
};
console.log('✅ 已启用 API 拦截器，所有 /api/get 请求会被记录');

// 6️⃣ 检查 postMessage 是否正常工作
let messageCount = 0;
const originalPostMessage = window.parent.postMessage;
window.parent.postMessage = function(message, targetOrigin) {
  if (message.pluginMessage) {
    messageCount++;
    console.log(`📤 Message #${messageCount}:`, message.pluginMessage.type);
  }
  return originalPostMessage.apply(this, arguments);
};
console.log('✅ 已启用 postMessage 拦截器');

// 7️⃣ 强制重新开始轮询（如果需要）
// 注意：只有在确定需要时才运行这个
/*
if (pollInterval) {
  clearInterval(pollInterval);
  console.log('⏸️ 已停止旧的轮询');
}
if (recordingSessionId) {
  startPolling(recordingSessionId);
  console.log('▶️ 已重新开始轮询');
}
*/
