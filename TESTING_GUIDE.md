# Figma Console 测试指南 - 验证 Supabase 数据同步

## 🎯 如何知道代码是否正常工作

按照时间顺序，你应该在 Figma Console 中看到这些消息：

---

## 阶段 1: 开始录音

### 在 Figma Console 应该看到：

```
🔨 Received message: start-meeting
⏱️ Meeting interval: 5 minutes
✅ Meeting started - Real-time canvas ready
```

### 在 Figma Canvas 应该看到：

✅ 出现一个大的蓝色 frame，名称为 `🔴 Real-time Meeting Canvas`
- 标题: "Real time Meeting Canvas"
- 副标题: "Duration: Every 5 mins"（或你设置的时间）

### 在 UI Panel (ui.html) Console 应该看到：

```
🔄 开始轮询，Session ID: 1234567890
📡 轮询 #1 - Session: 1234567890
📡 轮询 #2 - Session: 1234567890
...
```

---

## 阶段 2: 第一个 Segment 到达（约 5 分钟后）

### 数据流：

```
record.html → /api/summarize → Supabase
                ↓
ui.html polling 检测到 is_intermediate: true
                ↓
ui.html 发送消息给 code.ts
                ↓
code.ts 创建 segment card
```

### 在 UI Panel (ui.html) Console 应该看到：

```
📡 轮询 #150 - Session: 1234567890
📊 新的 segment: 1
```

### 在 Figma Plugin Console 应该看到：

```
🔨 Received message: update-segment-summary
📊 Received segment summary: 1
✅ Added segment 1 summary card at y=150
✅ Segment 1 added to canvas
```

### 在 Figma Canvas 应该看到：

✅ 在 Realtime Canvas 中出现一个新的 segment card：
- 标题: "📊 Segment 1 (5 min)"（或你的 intervalMin）
- 包含 summary 文本
- 包含 decisions 列表（如果有）
- 包含 knowledge（explicit + tacit）

### 在 Figma 通知（右下角）应该看到：

```
✅ Segment 1 added to canvas
```

---

## 阶段 3: 第二个 Segment 到达（约 10 分钟后）

### 在 UI Panel Console 应该看到：

```
📡 轮询 #300 - Session: 1234567890
📊 新的 segment: 2
```

### 在 Figma Plugin Console 应该看到：

```
🔨 Received message: update-segment-summary
📊 Received segment summary: 2
✅ Added segment 2 summary card at y=490
✅ Segment 2 added to canvas
```

### 在 Figma Canvas 应该看到：

✅ 第二个 segment card 出现在第一个下方：
- 标题: "📊 Segment 2 (5 min)"
- Y 位置: 490（第一个下方）
- Realtime Canvas 自动变高以容纳新卡片

---

## 阶段 4: 停止录音 + 最终结果

### 在 UI Panel Console 应该看到：

```
🎯 最终结果接收
```

### 在 Figma Plugin Console 应该看到：

```
🔨 Received message: final-summary-ready
✅ Final summary data received and stored
📊 Final summary ready!
🔨 Received message: insert-summary
🎯 Generating final summary with Supabase data
✅ Final summary canvas created with Supabase data
```

### 在 Figma Canvas 应该看到：

✅ 出现一个新的大 frame，名称为 `Meeting Summary - [日期]`
- 包含所有 sections:
  - 📊 Summary
  - 🎯 Key Decisions
  - 💡 Explicit Knowledge
  - 🧠 Tacit Knowledge
  - 🤔 Strategic Reasoning
  - 💬 Suggestions
- 自动居中并缩放到视口

### 在 Figma 通知应该看到：

```
✅ Final summary created with Supabase data!
```

---

## 🔍 如何打开 Console

### Figma Plugin Console（code.ts 的输出）

1. 在 Figma 中打开插件
2. **方法 1**: 右键点击插件窗口 → "Open DevTools" → "Console" tab
3. **方法 2**: Figma 菜单 → Plugins → Development → "Open Console"

### UI Panel Console（ui.html 的输出）

1. 在 Figma 插件窗口中
2. 右键点击插件界面
3. 选择 "Inspect" 或 "检查"
4. 切换到 "Console" tab

---

## ✅ 成功的完整 Console 输出示例

### Figma Plugin Console (code.ts)

```
🔨 Received message: start-meeting
⏱️ Meeting interval: 5 minutes
✅ Meeting started - Real-time canvas ready

[5分钟后]
🔨 Received message: update-segment-summary
📊 Received segment summary: 1
✅ Added segment 1 summary card at y=150
✅ Segment 1 added to canvas

[10分钟后]
🔨 Received message: update-segment-summary
📊 Received segment summary: 2
✅ Added segment 2 summary card at y=490
✅ Segment 2 added to canvas

[15分钟后]
🔨 Received message: update-segment-summary
📊 Received segment summary: 3
✅ Added segment 3 summary card at y=830
✅ Segment 3 added to canvas

[停止录音]
🔨 Received message: final-summary-ready
✅ Final summary data received and stored
📊 Final summary ready!
🔨 Received message: insert-summary
🎯 Generating final summary with Supabase data
✅ Final summary canvas created with Supabase data
```

### UI Panel Console (ui.html)

```
🔄 开始轮询，Session ID: 1730123456789
📡 轮询 #1 - Session: 1730123456789
📡 轮询 #2 - Session: 1730123456789
...
📡 轮询 #150 - Session: 1730123456789
📊 新的 segment: 1

📡 轮询 #151 - Session: 1730123456789
📡 轮询 #152 - Session: 1730123456789
...
📡 轮询 #300 - Session: 1730123456789
📊 新的 segment: 2

...
🎯 最终结果接收
```

---

## ❌ 错误情况 - 如何判断出问题了

### 问题 1: 没有收到 segment 数据

**症状**:
```
📡 轮询 #150 - Session: 1730123456789
📡 轮询 #151 - Session: 1730123456789
📡 轮询 #152 - Session: 1730123456789
... (一直轮询，但没有 "📊 新的 segment")
```

**可能原因**:
- Supabase 没有保存数据
- `is_intermediate` 字段为 false 或不存在
- `segment_number` 没有递增
- 网络问题

**检查方法**:
1. 打开 UI Panel Console
2. 查看轮询返回的数据:
   ```javascript
   console.log('📊 Data from Supabase:', data);
   ```

---

### 问题 2: code.ts 没有收到消息

**症状**:
- UI Panel Console 显示 "📊 新的 segment: 1"
- 但 Figma Plugin Console 没有 "🔨 Received message: update-segment-summary"

**可能原因**:
- `parent.postMessage` 发送失败
- code.ts 的 `figma.ui.onmessage` 没有正确处理

**检查方法**:
1. 在 code.ts 的 `figma.ui.onmessage` 最顶部添加:
   ```typescript
   console.log('🔨 Received message:', msg.type, msg);
   ```

---

### 问题 3: Segment card 没有显示

**症状**:
- Figma Plugin Console 显示 "📊 Received segment summary: 1"
- 但 Canvas 上没有出现 segment card
- 或出现错误消息

**可能原因**:
- Font 加载失败
- Canvas 没有初始化
- 数据格式错误

**检查方法**:
```
// 查看是否有错误
❌ Error creating segment summary card: ...
```

---

### 问题 4: Final summary 是空的

**症状**:
- Final summary canvas 创建了
- 但里面没有内容或显示 "N/A"

**可能原因**:
- `meetingData.finalData` 为 null
- Supabase 没有返回 `is_final: true` 的数据

**检查方法**:
```typescript
// 在 generateFinalSummary() 中添加
console.log('Final data:', meetingData.finalData);
console.log('Segments:', meetingData.segments);
```

---

## 🧪 测试 Checklist

### 开始录音时

- [ ] Figma Console: `✅ Meeting started - Real-time canvas ready`
- [ ] Canvas: 出现 Realtime Canvas frame
- [ ] UI Console: `🔄 开始轮询`

### 第一个 Segment（5分钟后）

- [ ] UI Console: `📊 新的 segment: 1`
- [ ] Figma Console: `🔨 Received message: update-segment-summary`
- [ ] Figma Console: `✅ Added segment 1 summary card`
- [ ] Canvas: 出现 "📊 Segment 1 (5 min)" card
- [ ] Card 包含 summary 文本
- [ ] Card 包含 decisions 列表

### 第二个 Segment（10分钟后）

- [ ] UI Console: `📊 新的 segment: 2`
- [ ] Figma Console: `✅ Added segment 2 summary card`
- [ ] Canvas: 出现第二个 segment card
- [ ] 第二个 card 在第一个下方
- [ ] Realtime Canvas 变高了

### 停止录音 + Final Summary

- [ ] UI Console: `🎯 最终结果接收`
- [ ] Figma Console: `✅ Final summary data received and stored`
- [ ] Figma Console: `🎯 Generating final summary with Supabase data`
- [ ] Canvas: 出现 "Meeting Summary - [日期]" frame
- [ ] Final summary 包含所有 sections
- [ ] 内容来自 Supabase（不是空的）

---

## 🔧 调试技巧

### 1. 添加更多 Console Log

在 ui.html 的 `startPolling()` 中:
```javascript
if (data && data.is_intermediate && data.segment_number > lastSegmentNumber) {
  console.log('📊 新的 segment:', data.segment_number);
  console.log('📊 Complete data:', data);  // ← 添加这行
  console.log('📊 Decisions:', data.decision);  // ← 添加这行
  console.log('📊 Duration:', data.duration_minutes);  // ← 添加这行
}
```

在 code.ts 的 `handleSegmentSummary()` 中:
```typescript
async function handleSegmentSummary(data: any) {
  console.log('📊 Received segment summary:', data.segmentNumber);
  console.log('📊 Data object:', data);  // ← 添加这行
  console.log('📊 Decisions count:', data.decisions?.length);  // ← 添加这行
}
```

### 2. 检查 Supabase 数据

在浏览器中直接访问:
```
https://your-domain.vercel.app/api/get?session=YOUR_SESSION_ID
```

应该返回:
```json
{
  "session_id": "...",
  "is_intermediate": true,
  "segment_number": 1,
  "duration_minutes": 5,
  "summary": "...",
  "decision": ["...", "..."],
  "explicit": ["..."],
  "tacit": ["..."]
}
```

### 3. 测试消息发送

在 ui.html Console 中手动测试:
```javascript
parent.postMessage({
  pluginMessage: {
    type: 'update-segment-summary',
    data: {
      segmentNumber: 999,
      summary: 'Test summary',
      decisions: ['Test decision 1', 'Test decision 2'],
      explicit: ['Test explicit'],
      tacit: ['Test tacit'],
      durationMinutes: 5
    }
  }
}, '*');
```

应该在 Figma Console 看到 segment 999 被创建。

---

## 📊 完整的成功数据流

```
用户点击 "Start Recording"
  ↓
ui.html: 🔄 开始轮询，Session ID: xxx
  ↓
code.ts: 🔨 Received message: start-meeting
code.ts: ✅ Meeting started - Real-time canvas ready
Canvas: 出现 Realtime Canvas
  ↓
[等待 5 分钟]
  ↓
record.html → /api/summarize → Supabase (保存 segment 1)
  ↓
ui.html: 📡 轮询 #150
ui.html: 📊 新的 segment: 1
ui.html: 发送 update-segment-summary 消息
  ↓
code.ts: 🔨 Received message: update-segment-summary
code.ts: 📊 Received segment summary: 1
code.ts: ✅ Added segment 1 summary card at y=150
code.ts: ✅ Segment 1 added to canvas
Canvas: 出现 Segment 1 card
Notification: ✅ Segment 1 added to canvas
  ↓
[继续录音...]
  ↓
用户点击 "Stop Recording"
  ↓
/api/final-analyze → Supabase (保存 final)
  ↓
ui.html: 📡 检测到 is_final: true
ui.html: 🎯 最终结果接收
ui.html: 发送 final-summary-ready 消息
  ↓
code.ts: 🔨 Received message: final-summary-ready
code.ts: ✅ Final summary data received and stored
code.ts: 📊 Final summary ready!
  ↓
ui.html: 发送 insert-summary 消息
  ↓
code.ts: 🔨 Received message: insert-summary
code.ts: 🎯 Generating final summary with Supabase data
code.ts: ✅ Final summary canvas created with Supabase data
Canvas: 出现 Final Summary frame
Notification: ✅ Final summary created with Supabase data!
```

---

## 🎯 快速验证

只需检查这 4 个关键消息：

1. ✅ `Meeting started - Real-time canvas ready`
2. ✅ `Added segment 1 summary card`
3. ✅ `Final summary data received and stored`
4. ✅ `Final summary created with Supabase data`

如果这 4 个消息都出现了，说明代码正常工作！

---

## ⚠️ 常见陷阱

1. **忘记编译**: 修改 code.ts 后必须运行 `npm run build`
2. **Cache 问题**: Figma 可能缓存旧代码，需要关闭并重新打开插件
3. **Console 位置错误**: ui.html 的 log 在浏览器 Console，code.ts 的 log 在 Figma Plugin Console
4. **时间太短**: 至少等待完整的 intervalMin 时间（例如 5 分钟）

---

希望这个测试指南能帮助你验证代码是否正常工作！🚀
