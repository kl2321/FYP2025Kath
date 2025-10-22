// ========================================
// 修复超时问题 - 移除超时限制
// 在 ui.html 的 startPolling() 函数中
// ========================================

function startPolling(sessionId) {
  let lastSegmentNumber = 0;
  let lastFinalData = null;
  // ❌ 删除：let pollTimeoutId = null;  // 不再需要超时
  let pollCount = 0;

  console.log('🔄 开始轮询，Session ID:', sessionId);

  // ❌ 删除整个超时设置
  // pollTimeoutId = setTimeout(() => { ... }, 30000);

  // 开始定期轮询
  pollInterval = setInterval(async () => {
    pollCount++;
    console.log(`📡 轮询 #${pollCount} - Session: ${sessionId}`);

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/get?session=${sessionId}`);

      if (!res.ok) {
        console.error('❌ 轮询请求失败:', res.status);
        return;
      }

      const data = await res.json();

      // 检查是否有新的中间结果
      if (data && data.is_intermediate && data.segment_number > lastSegmentNumber) {
        console.log('📊 新的 segment:', data.segment_number);

        // ❌ 删除：超时重置逻辑
        // if (pollTimeoutId) { clearTimeout(pollTimeoutId); ... }

        // 发送完整的 segment summary 给 code.ts
        parent.postMessage({
          pluginMessage: {
            type: 'update-segment-summary',
            data: {
              segmentNumber: data.segment_number,
              summary: data.summary || '',
              decisions: Array.isArray(data.decision) ? data.decision : [],
              explicit: Array.isArray(data.explicit) ? data.explicit : [],
              tacit: Array.isArray(data.tacit) ? data.tacit : [],
              reasoning: data.reasoning || '',
              suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
              durationMinutes: data.duration_minutes || formData.intervalMin || 5,
              speakerCount: data.speaker_count || 0
            }
          }
        }, '*');

        lastSegmentNumber = data.segment_number;

        formData.results = {
          ...formData.results,
          latestSegment: data,
          decisions: data.decision || [],
          transcript: data.transcript || ''
        };

        const decisionsCount = Array.isArray(data.decision) ? data.decision.length : 0;
        if (decisionsCount > 0) {
          showMessage(`Segment ${data.segment_number}: ${decisionsCount} decision(s)`, 'success');
        }
      }

      // 检查是否有最终结果
      if (data && data.is_final && JSON.stringify(data) !== JSON.stringify(lastFinalData)) {
        console.log('🎯 最终结果接收');

        parent.postMessage({
          pluginMessage: {
            type: 'final-summary-ready',
            data: {
              summary: data.summary || '',
              decisions: Array.isArray(data.decision) ? data.decision : [],
              explicit: Array.isArray(data.explicit) ? data.explicit : [],
              tacit: Array.isArray(data.tacit) ? data.tacit : [],
              reasoning: data.reasoning || '',
              suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
              transcript: data.transcript || '',
              durationMinutes: data.duration_minutes || 0,
              speakerCount: data.speaker_count || 0
            }
          }
        }, '*');

        lastFinalData = data;

        // 停止轮询
        clearInterval(pollInterval);
        // ❌ 删除：clearTimeout(pollTimeoutId);

        setTimeout(() => {
          parent.postMessage({
            pluginMessage: {
              type: 'insert-summary'
            }
          }, '*');
        }, 1000);
      }

    } catch (err) {
      console.error('❌ 轮询错误:', err);

      // 错误重试机制
      pollRetryCount = (pollRetryCount || 0) + 1;

      if (pollRetryCount >= API_CONFIG.polling.maxRetries) {
        console.error('❌ 达到最大重试次数，停止轮询');
        clearInterval(pollInterval);
        // ❌ 删除：clearTimeout(pollTimeoutId);
        showMessage('Connection lost. Please check your network.', 'error');
      }
    }

  }, API_CONFIG.polling.interval || 2000);

  // 返回清理函数
  return () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    // ❌ 删除：超时清理
    // if (pollTimeoutId) { clearTimeout(pollTimeoutId); }
  };
}

// ========================================
// 主要改动：
// ========================================
// 1. 完全移除 pollTimeoutId 变量
// 2. 删除所有 setTimeout 和 clearTimeout 调用
// 3. 轮询将持续进行，直到：
//    - 收到 is_final: true
//    - 用户手动停止
//    - 网络错误达到最大重试次数
// ========================================

// 优点：
// - 简单，不会意外超时
// - 适合长时间录音
// - 用户可以手动控制停止

// 缺点：
// - 如果忘记停止，会一直轮询
// - 但这不是问题，因为用户必须主动停止录音
