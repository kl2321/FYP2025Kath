# 轮询无法检测到 Supabase 数据 - 调试指南

## 🔴 问题描述

**症状**:
- ✅ 轮询正常运行（持续看到 `📡 轮询 #X` 消息）
- ✅ Supabase 有数据
- ❌ Figma Console 没有反应
- ❌ 没有看到 `📊 新的 segment: X` 消息

**结论**: 轮询正常，但**检测逻辑**有问题。

---

## 🔍 调试步骤

### 步骤 1: 检查 Supabase 实际返回的数据

在浏览器中直接访问你的 API：

```
https://your-domain.vercel.app/api/get?session=1761097717573
```

**应该看到类似这样的数据**:
```json
{
  "session_id": "1761097717573",
  "is_intermediate": true,
  "segment_number": 1,
  "duration_minutes": 5,
  "summary": "...",
  "decision": ["...", "..."],
  "explicit": ["..."],
  "tacit": ["..."]
}
```

**如果看到空对象 `{}`**:
- ❌ Supabase 没有数据
- 检查 record.html 是否成功调用了 /api/save

**如果看到数据但没有 `is_intermediate` 或 `segment_number`**:
- ❌ 数据结构不对
- 检查 /api/save 保存的字段

---

### 步骤 2: 在 ui.html Console 中添加调试输出

在 ui.html 的 `startPolling()` 函数中添加更多 console.log：

**找到轮询循环的位置**:
```javascript
pollInterval = setInterval(async () => {
  pollCount++;
  console.log(`📡 轮询 #${pollCount} - Session: ${sessionId}`);

  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/api/get?session=${sessionId}`);
    const data = await res.json();

    // ✅ 添加这行 - 查看实际返回的数据
    console.log('🔍 Supabase 返回的数据:', data);

    // 检查是否有新的中间结果
    if (data && data.is_intermediate && data.segment_number > lastSegmentNumber) {
      console.log('📊 新的 segment:', data.segment_number);
      // ...
    } else {
      // ✅ 添加这行 - 查看为什么没有检测到
      console.log('⚠️ 没有检测到新数据. 原因:', {
        hasData: !!data,
        isIntermediate: data?.is_intermediate,
        segmentNumber: data?.segment_number,
        lastSegmentNumber: lastSegmentNumber,
        condition: data?.segment_number > lastSegmentNumber
      });
    }

  } catch (err) {
    console.error('❌ 轮询错误:', err);
  }
}, 2000);
```

---

### 步骤 3: 刷新插件并查看 Console

1. 保存 ui.html
2. 关闭并重新打开 Figma 插件
3. 右键点击插件界面 → "Inspect"
4. 切换到 "Console" tab
5. 开始录音

**你应该看到**:
```
📡 轮询 #1 - Session: 1761097717573
🔍 Supabase 返回的数据: {}
⚠️ 没有检测到新数据. 原因: { hasData: false, ... }

📡 轮询 #2 - Session: 1761097717573
🔍 Supabase 返回的数据: {}
⚠️ 没有检测到新数据. 原因: { hasData: false, ... }

...

📡 轮询 #150 - Session: 1761097717573
🔍 Supabase 返回的数据: { session_id: "...", is_intermediate: true, segment_number: 1, ... }
⚠️ 没有检测到新数据. 原因: { hasData: true, isIntermediate: true, segmentNumber: 1, lastSegmentNumber: 0, condition: true }
```

最后一条消息会告诉你**为什么没有检测到**。

---

## 🐛 常见问题和解决方案

### 问题 1: 数据返回但 `is_intermediate` 为 `undefined`

**Console 显示**:
```
🔍 Supabase 返回的数据: { session_id: "...", summary: "...", decision: [...] }
⚠️ 没有检测到新数据. 原因: { isIntermediate: undefined, ... }
```

**原因**: Supabase 数据没有 `is_intermediate` 字段

**解决**:
1. 检查 `/api/save.js` 是否保存了这个字段
2. 检查 Supabase 表结构是否有这个列

**修复 /api/save.js**:
```javascript
const saveData = {
  session_id: session,
  transcript,
  summary,
  decision,
  explicit,
  tacit,
  reasoning,
  suggestions,
  is_final: is_final || false,
  is_intermediate: is_intermediate || false  // ← 确保这行存在
};
```

---

### 问题 2: 数据返回但 `segment_number` 为 `undefined` 或 `null`

**Console 显示**:
```
🔍 Supabase 返回的数据: { is_intermediate: true, summary: "...", segment_number: null }
⚠️ 没有检测到新数据. 原因: { segmentNumber: null, condition: false }
```

**原因**: `segment_number` 没有正确保存

**解决**: 检查 record.html 或 /api/summarize 是否正确传递 `segment_number`

---

### 问题 3: ui.html 的代码还是旧版本

**Console 显示**:
```
📡 轮询 #1 - Session: 1761097717573
📝 发现新内容，长度: 1234
🎯 调用实时分析...
```

**原因**: 你的 ui.html 还在使用旧的 `startPolling()` 函数（检测 transcript 增量的版本）

**解决**:
1. 打开 `ui.html`
2. 找到 `function startPolling(sessionId)` (第 3237 行)
3. **完全替换**为 `ui.html.MODIFIED_startPolling.js` 中的新版本

---

### 问题 4: 检测条件错误

**Console 显示**:
```
🔍 Supabase 返回的数据: { is_intermediate: true, segment_number: 1, ... }
⚠️ 没有检测到新数据. 原因: {
  hasData: true,
  isIntermediate: true,
  segmentNumber: 1,
  lastSegmentNumber: 1,  // ← 注意这里
  condition: false        // ← 1 > 1 = false
}
```

**原因**: `lastSegmentNumber` 已经等于 1 了，所以检测不到

**可能情况**:
- 之前已经检测过这个 segment
- 刷新了插件但 `lastSegmentNumber` 被保存了

**解决**:
- 正常情况，等待下一个 segment（segment_number = 2）
- 或者重启录音（新的 session_id）

---

## 🔧 临时测试方案

### 方案 1: 手动触发检测（在 UI Console 中）

在 ui.html 的 Console 中输入：

```javascript
// 手动发送一个测试 segment
parent.postMessage({
  pluginMessage: {
    type: 'update-segment-summary',
    data: {
      segmentNumber: 999,
      summary: 'Test summary from console',
      decisions: ['Test decision 1', 'Test decision 2'],
      explicit: ['Test explicit'],
      tacit: ['Test tacit'],
      reasoning: 'Test reasoning',
      suggestions: ['Test suggestion'],
      durationMinutes: 5,
      speakerCount: 2
    }
  }
}, '*');
```

**应该看到**:
- Figma Plugin Console: `🔨 Received message: update-segment-summary`
- Figma Canvas: 出现 "📊 Segment 999 (5 min)" 卡片

**如果这个测试成功**:
- ✅ code.ts 的消息处理正常
- ❌ 问题在 ui.html 的轮询检测逻辑

---

### 方案 2: 强制检测（修改检测条件）

临时修改 ui.html 的检测条件：

```javascript
// 原来：
if (data && data.is_intermediate && data.segment_number > lastSegmentNumber) {

// 改为（临时）：
if (data && data.is_intermediate) {
  console.log('🔍 强制检测模式 - 所有 intermediate 数据:');
  console.log('  segment_number:', data.segment_number);
  console.log('  lastSegmentNumber:', lastSegmentNumber);

  // 即使不是新数据也发送
  parent.postMessage({ ... });
}
```

这样可以看到是否能接收到数据。

---

## 📝 完整的调试版 startPolling 函数

```javascript
function startPolling(sessionId) {
  let lastSegmentNumber = 0;
  let lastFinalData = null;
  let pollTimeoutId = null;
  let pollCount = 0;

  console.log('🔄 开始轮询，Session ID:', sessionId);
  console.log('🔍 调试模式已启用');

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
        console.error('❌ 请求失败:', res.status, res.statusText);
        return;
      }

      const data = await res.json();

      // 🔍 调试：显示返回的数据
      console.log('🔍 Supabase 返回:', data);

      // 检查是否有新的中间结果
      if (data && data.is_intermediate && data.segment_number > lastSegmentNumber) {
        console.log('✅ 检测到新 segment:', data.segment_number);

        // 重置超时
        if (pollTimeoutId) {
          clearTimeout(pollTimeoutId);
          pollTimeoutId = setTimeout(() => {
            clearInterval(pollInterval);
            console.warn('⚠️ 轮询超时');
          }, timeoutDuration);
        }

        // 发送消息
        console.log('📤 发送 update-segment-summary 消息');
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
        console.log('✅ lastSegmentNumber 更新为:', lastSegmentNumber);

      } else {
        // 🔍 调试：显示为什么没有检测到
        if (pollCount % 10 === 0) {  // 每 10 次显示一次，避免太多输出
          console.log('⚠️ 未检测到新数据:', {
            hasData: !!data,
            isIntermediate: data?.is_intermediate,
            isFinal: data?.is_final,
            segmentNumber: data?.segment_number,
            lastSegmentNumber: lastSegmentNumber,
            condition: data?.segment_number > lastSegmentNumber
          });
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
      console.error('错误详情:', err.message);
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
```

---

## ✅ 检查清单

请按顺序检查：

- [ ] **步骤 1**: 浏览器访问 `/api/get?session=xxx`，确认有数据
- [ ] **步骤 2**: 数据包含 `is_intermediate: true`
- [ ] **步骤 3**: 数据包含 `segment_number: 1`（或其他数字）
- [ ] **步骤 4**: ui.html 使用了新版本的 `startPolling()` 函数
- [ ] **步骤 5**: 添加了调试 console.log
- [ ] **步骤 6**: 刷新插件，查看 Console 输出
- [ ] **步骤 7**: 确认看到 `🔍 Supabase 返回:` 消息
- [ ] **步骤 8**: 检查返回的数据结构
- [ ] **步骤 9**: 检查 `⚠️ 未检测到新数据` 的原因

---

## 🎯 下一步

根据 Console 的输出，告诉我：

1. **`🔍 Supabase 返回:` 显示了什么？**
   - 空对象 `{}`
   - 有数据但缺少字段
   - 有完整数据

2. **`⚠️ 未检测到新数据` 的原因是什么？**
   - `hasData: false`
   - `isIntermediate: undefined`
   - `segmentNumber: null`
   - `condition: false`（为什么？）

3. **你的 ui.html 是否修改过？**
   - 是，已经替换为新版本
   - 否，还是原来的代码

把这些信息告诉我，我会帮你精确定位问题！
