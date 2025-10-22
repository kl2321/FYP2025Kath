// ========================================
// 修复超时问题 - 延长超时时间
// 在 ui.html 的 startPolling() 函数中
// ========================================

function startPolling(sessionId) {
  let lastSegmentNumber = 0;
  let lastFinalData = null;
  let pollTimeoutId = null;
  let pollCount = 0;

  console.log('🔄 开始轮询，Session ID:', sessionId);

  // ✅ 修改：计算超时时间 = intervalMin + 2 分钟的缓冲
  const intervalMin = formData.intervalMin || 5;  // 获取用户设置的间隔
  const timeoutDuration = (intervalMin + 2) * 60 * 1000;  // 转换为毫秒

  console.log(`⏰ 超时设置: ${intervalMin + 2} 分钟 (${timeoutDuration}ms)`);

  // 设置超时处理（intervalMin + 2分钟后才超时）
  pollTimeoutId = setTimeout(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
      console.warn('⚠️ 轮询超时');
      showMessage('Recording timeout. Please check your connection.', 'warning');
    }
  }, timeoutDuration);  // ← 改用计算的超时时间

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

        // ✅ 收到数据后重置超时
        if (pollTimeoutId) {
          clearTimeout(pollTimeoutId);
          pollTimeoutId = setTimeout(() => {
            clearInterval(pollInterval);
            console.warn('⚠️ 轮询超时');
          }, timeoutDuration);  // ← 同样使用计算的超时时间
        }

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

        // 更新 formData
        formData.results = {
          ...formData.results,
          latestSegment: data,
          decisions: data.decision || [],
          transcript: data.transcript || ''
        };

        // 显示通知
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
        clearTimeout(pollTimeoutId);

        // 触发最终摘要生成
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
        clearTimeout(pollTimeoutId);
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
    if (pollTimeoutId) {
      clearTimeout(pollTimeoutId);
      pollTimeoutId = null;
    }
  };
}

// ========================================
// 主要改动：
// ========================================
// 1. 计算超时时间 = intervalMin + 2 分钟
// 2. 如果 intervalMin = 5，超时 = 7 分钟 (420秒)
// 3. 如果 intervalMin = 10，超时 = 12 分钟 (720秒)
// 4. 添加 console.log 显示超时设置
// ========================================

// 示例：
// - intervalMin = 5 → timeout = 7分钟 (420,000ms)
// - intervalMin = 10 → timeout = 12分钟 (720,000ms)
// - intervalMin = 3 → timeout = 5分钟 (300,000ms)
