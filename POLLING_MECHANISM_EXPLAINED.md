# 轮询机制详解 - 如何检测 Supabase 的 Summary 数据

## 🎯 核心问题

**Q: ui.html 的轮询在做什么？**
**A: 每 2 秒向 Supabase 查询一次，检查是否有新的分析结果。**

**Q: 轮询能检测到 record.html 的 summary 吗？**
**A: 不是直接检测 record.html，而是检测 record.html 保存到 Supabase 的数据。**

---

## 📊 完整的数据流

```
┌─────────────────────────────────────────────────────────────────┐
│  第 1 步：录音和分析                                               │
└─────────────────────────────────────────────────────────────────┘

record.html (录音窗口)
  ↓ 每 5 分钟录制一段音频
  ↓
发送音频到后端
  ↓
POST /api/summarize
  ├─ 输入: 音频文件 + session_id
  ├─ 处理: AssemblyAI 转录 + OpenAI 分析
  └─ 输出: {
        transcript: "对话文本",
        summary: "这5分钟的摘要",
        decision: ["决策1", "决策2"],
        explicit: ["显性知识"],
        tacit: ["隐性知识"],
        reasoning: "推理过程",
        suggestions: ["建议"]
      }
  ↓
自动调用 POST /api/save
  ↓
保存到 Supabase
  └─ sessions 表插入一条记录:
      {
        session_id: "1761097717573",
        is_intermediate: true,        ← 标记为中间结果
        segment_number: 1,            ← 第 1 段
        duration_minutes: 5,
        summary: "...",
        decision: ["...", "..."],
        transcript: "...",
        created_at: "2025-10-22T10:05:00Z"
      }


┌─────────────────────────────────────────────────────────────────┐
│  第 2 步：轮询检测                                                 │
└─────────────────────────────────────────────────────────────────┘

ui.html (Figma 插件窗口)
  ↓ 每 2 秒执行一次
  ↓
GET /api/get?session=1761097717573
  ↓ 内部查询
  ↓
Supabase 数据库查询
  SELECT * FROM sessions
  WHERE session_id = '1761097717573'
  ORDER BY created_at DESC
  LIMIT 1
  ↓ 返回最新的一条记录
  ↓
{
  session_id: "1761097717573",
  is_intermediate: true,
  segment_number: 1,
  summary: "这5分钟讨论了...",
  decision: ["决策A", "决策B"],
  ...
}
  ↓
ui.html 接收数据
  ↓
检查: segment_number > lastSegmentNumber ?
  ↓
如果是新 segment:
  ├─ console.log('📊 新的 segment: 1')
  ├─ 发送消息给 code.ts
  └─ parent.postMessage({
        type: 'update-segment-summary',
        data: { ...从 Supabase 获取的数据... }
      })


┌─────────────────────────────────────────────────────────────────┐
│  第 3 步：显示到 Canvas                                            │
└─────────────────────────────────────────────────────────────────┘

code.ts (Figma 插件后端)
  ↓
接收消息: 'update-segment-summary'
  ↓
调用: handleSegmentSummary(data)
  ↓
调用: canvasManager.addSegmentSummaryCard(...)
  ↓
在 Figma Canvas 创建卡片
  └─ 显示: "📊 Segment 1 (5 min)"
            + summary 内容
            + decisions 列表
            + knowledge
```

---

## 🔍 详细解析轮询机制

### 1. 什么是轮询？

**轮询（Polling）** = 定期检查（每隔一段时间查询一次）

```javascript
// ui.html 中的轮询代码
pollInterval = setInterval(async () => {
  pollCount++;
  console.log(`📡 轮询 #${pollCount} - Session: ${sessionId}`);

  // 向服务器查询数据
  const res = await fetch(`${API_CONFIG.BASE_URL}/api/get?session=${sessionId}`);
  const data = await res.json();

  // 检查数据...
}, 2000);  // 每 2000 毫秒 = 2 秒执行一次
```

### 2. 轮询的时间线

```
0秒    → 开始轮询，发送第 1 次请求
2秒    → 发送第 2 次请求（上次的 2 秒后）
4秒    → 发送第 3 次请求
6秒    → 发送第 4 次请求
...
298秒  → 发送第 149 次请求
300秒  → 发送第 150 次请求 → Supabase 有数据了！
```

---

## 🗄️ Supabase 如何存储数据

### sessions 表结构

| 字段 | 类型 | 示例值 | 说明 |
|------|------|--------|------|
| session_id | text | "1761097717573" | 会话 ID |
| is_intermediate | boolean | true | 是否中间结果 |
| is_final | boolean | false | 是否最终结果 |
| segment_number | integer | 1 | 第几段 |
| duration_minutes | integer | 5 | 时长（分钟） |
| transcript | text | "Speaker 1: ..." | 对话文本 |
| summary | text | "本段讨论了..." | 摘要 |
| decision | json array | ["决策1", "决策2"] | 决策列表 |
| explicit | json array | ["事实1"] | 显性知识 |
| tacit | json array | ["洞察1"] | 隐性知识 |
| reasoning | text | "分析..." | 推理过程 |
| suggestions | json array | ["建议1"] | 建议列表 |
| speaker_count | integer | 3 | 参与人数 |
| created_at | timestamp | "2025-10-22T10:05:00Z" | 创建时间 |

### 数据示例

#### 中间结果（Segment 1）

```json
{
  "session_id": "1761097717573",
  "is_intermediate": true,
  "is_final": false,
  "segment_number": 1,
  "duration_minutes": 5,
  "transcript": "Speaker 1: We need to focus on the user interface...",
  "summary": "The team discussed UI priorities and decided to focus on mobile-first design.",
  "decision": [
    "Adopt mobile-first design approach",
    "Use React Native for cross-platform development"
  ],
  "explicit": [
    "Current app has 60% mobile users",
    "React Native supports iOS and Android"
  ],
  "tacit": [
    "Mobile users have different expectations",
    "Team has more experience with React"
  ],
  "reasoning": "Given the high mobile user percentage, a mobile-first approach makes strategic sense.",
  "suggestions": [
    "Review React Native documentation",
    "Set up development environment"
  ],
  "speaker_count": 3,
  "created_at": "2025-10-22T10:05:00Z"
}
```

#### 中间结果（Segment 2）

5 分钟后，又插入一条新记录：

```json
{
  "session_id": "1761097717573",
  "is_intermediate": true,
  "is_final": false,
  "segment_number": 2,  // ← 递增
  "duration_minutes": 5,
  "summary": "The team discussed timeline and assigned tasks...",
  "decision": [
    "Sprint duration: 2 weeks",
    "Daily standup at 10 AM"
  ],
  ...
}
```

#### 最终结果

录音结束后：

```json
{
  "session_id": "1761097717573",
  "is_intermediate": false,
  "is_final": true,  // ← 最终结果
  "segment_number": null,
  "duration_minutes": 15,  // 总时长
  "summary": "Complete summary of the entire meeting...",
  "decision": [
    "All decisions from all segments combined"
  ],
  ...
}
```

---

## 🔄 轮询如何检测新数据

### ui.html 中的检测逻辑

```javascript
// 跟踪变量
let lastSegmentNumber = 0;  // 上次看到的 segment 编号

// 在轮询循环中
pollInterval = setInterval(async () => {
  // 1. 获取数据
  const res = await fetch(`/api/get?session=${sessionId}`);
  const data = await res.json();

  // 2. 检查是否是新的 intermediate segment
  if (data && data.is_intermediate && data.segment_number > lastSegmentNumber) {
    console.log('📊 新的 segment:', data.segment_number);

    // 3. 发送给 code.ts
    parent.postMessage({
      pluginMessage: {
        type: 'update-segment-summary',
        data: {
          segmentNumber: data.segment_number,
          summary: data.summary,
          decisions: data.decision,
          ...
        }
      }
    }, '*');

    // 4. 更新跟踪变量
    lastSegmentNumber = data.segment_number;
  }

  // 5. 检查是否是最终结果
  if (data && data.is_final) {
    console.log('🎯 最终结果接收');
    // 发送 final-summary-ready 消息...
  }
}, 2000);
```

### 检测逻辑图解

```
轮询 #1: Supabase 无数据 → 继续等待
轮询 #2: Supabase 无数据 → 继续等待
轮询 #3: Supabase 无数据 → 继续等待
...
轮询 #150: Supabase 有数据！
  ├─ 读取: segment_number = 1
  ├─ 比较: 1 > 0 (lastSegmentNumber) ? YES!
  ├─ 判断: 这是新数据
  ├─ 动作: 发送消息给 code.ts
  └─ 更新: lastSegmentNumber = 1

轮询 #151: Supabase 还是 segment_number = 1
  ├─ 比较: 1 > 1 ? NO
  └─ 判断: 不是新数据，忽略

轮询 #300: Supabase 有新数据！
  ├─ 读取: segment_number = 2
  ├─ 比较: 2 > 1 ? YES!
  ├─ 判断: 这是新数据
  ├─ 动作: 发送消息给 code.ts
  └─ 更新: lastSegmentNumber = 2
```

---

## 🌐 完整的通信流程

### 时间线示例（5 分钟间隔）

```
00:00 - 用户点击 "Start Recording"
        ├─ ui.html 开始轮询
        └─ record.html 开始录音

00:02 - 轮询 #1: GET /api/get?session=xxx
        └─ Supabase 返回: {} (空)

00:04 - 轮询 #2: GET /api/get?session=xxx
        └─ Supabase 返回: {} (空)

...

05:00 - record.html 完成第一段录音
        ├─ POST /api/summarize (音频 + session_id)
        ├─ AI 分析生成 summary
        └─ POST /api/save → Supabase
            INSERT segment_number = 1

05:02 - 轮询 #151: GET /api/get?session=xxx
        ├─ Supabase 返回: { segment_number: 1, summary: "...", ... }
        ├─ ui.html 检测: 1 > 0 ✅ 新数据！
        ├─ ui.html: console.log('📊 新的 segment: 1')
        ├─ ui.html → code.ts: postMessage('update-segment-summary')
        ├─ code.ts: console.log('📊 Received segment summary: 1')
        ├─ code.ts: 创建 Segment 1 卡片
        └─ Figma Canvas: 显示 "📊 Segment 1 (5 min)"

05:04 - 轮询 #152: GET /api/get?session=xxx
        ├─ Supabase 返回: { segment_number: 1, ... }
        ├─ ui.html 检测: 1 > 1 ❌ 不是新数据
        └─ 继续等待

...

10:00 - record.html 完成第二段录音
        └─ Supabase: INSERT segment_number = 2

10:02 - 轮询 #301: GET /api/get?session=xxx
        ├─ Supabase 返回: { segment_number: 2, summary: "...", ... }
        ├─ ui.html 检测: 2 > 1 ✅ 新数据！
        ├─ ui.html → code.ts: postMessage('update-segment-summary')
        ├─ code.ts: 创建 Segment 2 卡片
        └─ Figma Canvas: 显示第二个卡片

...

15:00 - 用户点击 "Stop Recording"
        ├─ record.html 发送完整录音
        ├─ POST /api/final-analyze
        └─ Supabase: INSERT is_final = true

15:02 - 轮询 #451: GET /api/get?session=xxx
        ├─ Supabase 返回: { is_final: true, summary: "完整摘要", ... }
        ├─ ui.html 检测: is_final = true ✅
        ├─ ui.html: console.log('🎯 最终结果接收')
        ├─ ui.html → code.ts: postMessage('final-summary-ready')
        ├─ ui.html → code.ts: postMessage('insert-summary')
        ├─ code.ts: 创建 Final Summary frame
        └─ Figma Canvas: 显示完整摘要
```

---

## 🔧 API 端点详解

### GET /api/get

**位置**: `/home/user/FYP2025Kath/api/get.js`

```javascript
export default async function handler(req, res) {
  const { session } = req.query;

  // 查询 Supabase
  const response = await fetch(
    `${config.supabase.url}/rest/v1/sessions?session_id=eq.${session}`,
    {
      headers: {
        apikey: config.supabase.anonKey,
        Authorization: `Bearer ${config.supabase.anonKey}`
      }
    }
  );

  const data = await response.json();

  // 返回最新的一条记录
  if (data.length > 0) {
    return res.status(200).json(data[0]);
  } else {
    return res.status(200).json({});
  }
}
```

**实际 SQL 查询**:
```sql
SELECT * FROM sessions
WHERE session_id = '1761097717573'
ORDER BY created_at DESC
LIMIT 1
```

这个查询会返回：
- **如果有数据**: 最新的一条记录（最新插入的 segment）
- **如果没有数据**: 空对象 `{}`

---

## 🎬 动画演示（文字版）

### 场景：第一个 Segment 到达

```
[Frame 1] 00:00:00 - 开始录音
┌─────────────────────────────────────┐
│ ui.html                              │
│ 📡 轮询 #1                           │
│ lastSegmentNumber = 0                │
└─────────────────────────────────────┘
                ↓ GET /api/get
┌─────────────────────────────────────┐
│ Supabase                             │
│ sessions 表: (空)                    │
└─────────────────────────────────────┘
                ↓ 返回 {}


[Frame 2] 00:05:00 - record.html 保存第一段
┌─────────────────────────────────────┐
│ record.html                          │
│ POST /api/summarize                  │
│ → POST /api/save                     │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ Supabase                             │
│ INSERT: segment_number = 1           │
│         summary = "..."              │
│         decisions = [...]            │
└─────────────────────────────────────┘


[Frame 3] 00:05:02 - 轮询检测到新数据
┌─────────────────────────────────────┐
│ ui.html                              │
│ 📡 轮询 #151                         │
│ lastSegmentNumber = 0                │
└─────────────────────────────────────┘
                ↓ GET /api/get
┌─────────────────────────────────────┐
│ Supabase                             │
│ 返回: segment_number = 1             │
│       summary = "..."                │
└─────────────────────────────────────┘
                ↓ { segment_number: 1, ... }
┌─────────────────────────────────────┐
│ ui.html                              │
│ 比较: 1 > 0 ? YES! ✅               │
│ console.log('📊 新的 segment: 1')   │
│ postMessage → code.ts                │
│ lastSegmentNumber = 1                │
└─────────────────────────────────────┘
                ↓ update-segment-summary
┌─────────────────────────────────────┐
│ code.ts                              │
│ 📊 Received segment summary: 1       │
│ 创建卡片...                          │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ Figma Canvas                         │
│ ┌─────────────────────────┐         │
│ │ 📊 Segment 1 (5 min)    │         │
│ │ Summary: ...             │         │
│ │ Decisions:               │         │
│ │  1. ...                  │         │
│ │  2. ...                  │         │
│ └─────────────────────────┘         │
└─────────────────────────────────────┘
```

---

## 🤔 常见问题

### Q1: 为什么不直接从 record.html 发送消息给 code.ts？

**A**: 因为 record.html 是外部窗口，无法直接通信：

```
record.html (外部浏览器窗口)
  ❌ 无法直接访问 Figma 插件
  ✅ 可以访问后端 API
  ✅ 可以写入 Supabase

ui.html (Figma 插件的 UI)
  ✅ 可以与 code.ts 通信
  ✅ 可以访问后端 API
  ✅ 可以读取 Supabase

code.ts (Figma 插件的后端)
  ✅ 可以操作 Canvas
  ✅ 可以接收 ui.html 的消息
  ❌ 无法直接访问网络
```

所以必须通过 Supabase 作为中间存储：
```
record.html → Supabase → ui.html (轮询) → code.ts → Canvas
```

---

### Q2: 为什么每 2 秒轮询一次？

**A**: 这是平衡：

| 轮询间隔 | 优点 | 缺点 |
|---------|------|------|
| 1 秒 | 更快检测 | 太频繁，浪费资源 |
| 2 秒 | 平衡 ✅ | 最多延迟 2 秒 |
| 5 秒 | 较少请求 | 延迟较大 |
| 10 秒 | 最少请求 | 延迟太大 |

2 秒是一个好的折衷：
- 足够快（用户几乎感觉不到延迟）
- 不会过度消耗资源
- 在 5 分钟内最多 150 次请求（可接受）

---

### Q3: 如果两个 segment 同时到达怎么办？

**A**: 不会同时到达，因为：

1. record.html 按顺序录音（5min → 10min → 15min）
2. 每段处理需要时间（约 10-30 秒）
3. Supabase 按 `segment_number` 递增插入
4. ui.html 检查 `segment_number > lastSegmentNumber`

即使理论上同时到达，轮询会按顺序检测：
```
轮询 #151: 检测到 segment 1 → 处理 → lastSegmentNumber = 1
轮询 #152: 检测到 segment 2 → 处理 → lastSegmentNumber = 2
```

---

### Q4: 如果网络断开会怎样？

**A**: 轮询有错误处理：

```javascript
try {
  const res = await fetch('/api/get?session=...');
  // ...
} catch (err) {
  console.error('❌ 轮询错误:', err);

  pollRetryCount++;

  if (pollRetryCount >= API_CONFIG.polling.maxRetries) {
    // 达到最大重试次数，停止轮询
    clearInterval(pollInterval);
    showMessage('Connection lost.', 'error');
  }
}
```

最多重试 3 次后会停止轮询并提示用户。

---

## 📊 性能分析

### 单次录音的网络请求

假设录音 15 分钟，间隔 5 分钟：

| 时间段 | 轮询次数 | Supabase 写入 | Supabase 读取 |
|--------|----------|--------------|--------------|
| 0-5 min | 150 | 1 (segment 1) | 150 |
| 5-10 min | 150 | 1 (segment 2) | 150 |
| 10-15 min | 150 | 1 (segment 3) | 150 |
| 结束时 | 1 | 1 (final) | 1 |
| **总计** | **451** | **4** | **451** |

**优化建议**：
- 轮询间隔可以根据 `intervalMin` 调整（例如 intervalMin=10 → 轮询间隔=3秒）
- 可以实现 Supabase Realtime（推送而非轮询）

---

## 🎯 总结

### 轮询机制的本质

```
ui.html 不断问 Supabase: "有新数据吗？有新数据吗？"
  ↓
Supabase 回答: "没有，没有，没有，... 有了！这是 segment 1"
  ↓
ui.html: "太好了！我告诉 code.ts"
  ↓
code.ts: "收到！我去画卡片"
  ↓
Canvas: 显示新卡片 ✅
```

### 关键点

1. ✅ **轮询目标**: Supabase 数据库（不是 record.html）
2. ✅ **检测方式**: 比较 `segment_number` 是否递增
3. ✅ **数据流向**: record.html → Supabase → ui.html → code.ts → Canvas
4. ✅ **更新频率**: 每 2 秒检查一次
5. ✅ **数据来源**: `/api/get` 从 Supabase 读取最新记录

### 为什么这样设计？

- record.html 是外部窗口，无法直接与 Figma 通信
- Supabase 作为中间存储，解决了通信问题
- 轮询是简单可靠的数据同步方式
- ui.html 作为桥梁连接外部世界和 Figma

---

希望这个详细解释帮助你理解了轮询机制！🚀

有任何疑问随时问我！
