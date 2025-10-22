// ========================================
// 修改后的 startPolling 函数
// 位置: ui.html 第 3237 行
// ========================================

function startPolling(sessionId) {
  // 初始化状态变量
  let lastSegmentNumber = 0;        // 【新增】跟踪已处理的segment编号
  let lastFinalData = null;         // 【新增】跟踪最终结果
  let pollTimeoutId = null;
  let pollCount = 0;

  console.log('🔄 开始轮询，Session ID:', sessionId);

  // 设置超时处理（30秒后停止轮询）
  pollTimeoutId = setTimeout(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
      console.warn('⚠️ 轮询超时');
      showMessage('Recording timeout. Please check your connection.', 'warning');
    }
  }, API_CONFIG.polling.timeout || 30000);

  // 开始定期轮询
  pollInterval = setInterval(async () => {
    pollCount++;
    console.log(`📡 轮询 #${pollCount} - Session: ${sessionId}`);

    try {
      // 1. 从 Supabase 获取数据
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/get?session=${sessionId}`);

      if (!res.ok) {
        console.error('❌ 轮询请求失败:', res.status);
        return;
      }

      const data = await res.json();

      // 【新增】2. 检查是否有新的中间结果 (intermediate segment)
      if (data && data.is_intermediate && data.segment_number > lastSegmentNumber) {
        console.log('📊 新的 segment:', data.segment_number);

        // 清除超时（说明还在活动）
        if (pollTimeoutId) {
          clearTimeout(pollTimeoutId);
          pollTimeoutId = setTimeout(() => {
            clearInterval(pollInterval);
            console.warn('⚠️ 轮询超时');
          }, 30000);
        }

        // 【新增】发送完整的 segment summary 给 code.ts
        parent.postMessage({
          pluginMessage: {
            type: 'update-segment-summary',  // 【新增】新的消息类型
            data: {
              segmentNumber: data.segment_number,
              summary: data.summary || '',
              decisions: Array.isArray(data.decision) ? data.decision : [],
              explicit: Array.isArray(data.explicit) ? data.explicit : [],
              tacit: Array.isArray(data.tacit) ? data.tacit : [],
              reasoning: data.reasoning || '',
              suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
              durationMinutes: data.duration_minutes || formData.intervalMin || 5,  // 【新增】使用 Supabase 的 duration
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

      // 【新增】3. 检查是否有最终结果 (final summary)
      if (data && data.is_final && JSON.stringify(data) !== JSON.stringify(lastFinalData)) {
        console.log('🎯 最终结果接收');

        // 【新增】发送最终数据给 code.ts
        parent.postMessage({
          pluginMessage: {
            type: 'final-summary-ready',  // 【新增】新的消息类型
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

  }, API_CONFIG.polling.interval || 2000);  // 每2秒轮询一次

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
// 主要修改点总结：
// ========================================
// 1. 新增 lastSegmentNumber 变量跟踪已处理的 segment
// 2. 新增 lastFinalData 变量跟踪最终结果
// 3. 检测 is_intermediate 并发送 'update-segment-summary' 消息
// 4. 检测 is_final 并发送 'final-summary-ready' 消息
// 5. 使用 data.duration_minutes 而不是硬编码的 5 分钟
// 6. 发送完整的 Supabase 数据（summary + decisions + knowledge）
// ========================================
