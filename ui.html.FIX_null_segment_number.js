// ========================================
// 修复 segment_number 为 null 的问题
// 使用 data.id 代替 segment_number 来检测新数据
// ========================================

function startPolling(sessionId) {
  // 跟踪变量
  let lastDataId = 0;           // ✅ 改用 data.id 来跟踪
  let lastFinalData = null;
  let pollTimeoutId = null;
  let pollCount = 0;

  console.log('🔄 开始轮询，Session ID:', sessionId);

  // 计算超时时间
  const intervalMin = formData.intervalMin || 5;
  const timeoutDuration = (intervalMin + 2) * 60 * 1000;
  console.log(`⏰ 超时设置: ${intervalMin + 2} 分钟`);

  pollTimeoutId = setTimeout(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
      console.warn('⚠️ 轮询超时');
    }
  }, timeoutDuration);

  pollInterval = setInterval(async () => {
    pollCount++;
    console.log(`📡 轮询 #${pollCount} - Session: ${sessionId}`);

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/get?session=${sessionId}`);

      if (!res.ok) {
        console.error('❌ 请求失败:', res.status);
        return;
      }

      const data = await res.json();

      // 🔍 调试输出
      if (pollCount % 10 === 0) {  // 每 10 次显示一次
        console.log('🔍 当前数据:', {
          id: data.id,
          is_intermediate: data.is_intermediate,
          segment_number: data.segment_number,
          lastDataId: lastDataId
        });
      }

      // ✅ 修改：使用 data.id 代替 segment_number
      if (data && data.is_intermediate && data.id && data.id > lastDataId) {
        console.log('📊 新的数据检测到 (ID:', data.id, ')');

        // 重置超时
        if (pollTimeoutId) {
          clearTimeout(pollTimeoutId);
          pollTimeoutId = setTimeout(() => {
            clearInterval(pollInterval);
            console.warn('⚠️ 轮询超时');
          }, timeoutDuration);
        }

        // ✅ 使用 data.id 作为 segmentNumber（如果 segment_number 是 null）
        const segmentNumber = data.segment_number || data.id;

        // 发送消息给 code.ts
        console.log('📤 发送 update-segment-summary 消息');
        parent.postMessage({
          pluginMessage: {
            type: 'update-segment-summary',
            data: {
              segmentNumber: segmentNumber,
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

        // 更新跟踪变量
        lastDataId = data.id;
        console.log('✅ lastDataId 更新为:', lastDataId);

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
          showMessage(`New data: ${decisionsCount} decision(s)`, 'success');
        }
      }

      // 检查最终结果
      if (data && data.is_final && JSON.stringify(data) !== JSON.stringify(lastFinalData)) {
        console.log('🎯 检测到最终结果');

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
        clearInterval(pollInterval);
        clearTimeout(pollTimeoutId);

        setTimeout(() => {
          parent.postMessage({
            pluginMessage: { type: 'insert-summary' }
          }, '*');
        }, 1000);
      }

    } catch (err) {
      console.error('❌ 轮询错误:', err);

      pollRetryCount = (pollRetryCount || 0) + 1;

      if (pollRetryCount >= API_CONFIG.polling.maxRetries) {
        console.error('❌ 达到最大重试次数');
        clearInterval(pollInterval);
        clearTimeout(pollTimeoutId);
        showMessage('Connection lost.', 'error');
      }
    }

  }, 2000);

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
// 1. 使用 lastDataId 代替 lastSegmentNumber
// 2. 检测条件：data.id > lastDataId
// 3. segmentNumber = data.segment_number || data.id（兼容两种情况）
// 4. 添加调试输出显示当前状态
// ========================================
