# 修复 segment_number 为 null 的问题

## 🔴 问题根源

你的 Supabase 数据：
```json
{
  "id": 493,
  "is_intermediate": true,
  "segment_number": null,  // ← 问题在这里！
  "summary": "...",
  "decision": [...]
}
```

检测逻辑：
```javascript
if (data.segment_number > lastSegmentNumber) {
  // null > 0 = false ❌
  // 永远检测不到！
}
```

---

## ✅ 立即解决方案（推荐）

### 使用 `data.id` 代替 `segment_number`

**在 ui.html 的 `startPolling()` 函数中修改：**

#### 修改点 1: 改变跟踪变量（函数开始处）

**原代码：**
```javascript
let lastSegmentNumber = 0;
```

**改为：**
```javascript
let lastDataId = 0;  // ✅ 使用 data.id
```

#### 修改点 2: 改变检测条件

**原代码：**
```javascript
if (data && data.is_intermediate && data.segment_number > lastSegmentNumber) {
```

**改为：**
```javascript
if (data && data.is_intermediate && data.id && data.id > lastDataId) {
```

#### 修改点 3: 更新跟踪变量

**原代码：**
```javascript
lastSegmentNumber = data.segment_number;
```

**改为：**
```javascript
lastDataId = data.id;
```

#### 修改点 4: 传递 segmentNumber（兼容处理）

**在 `parent.postMessage` 的 data 对象中：**

**原代码：**
```javascript
segmentNumber: data.segment_number,
```

**改为：**
```javascript
segmentNumber: data.segment_number || data.id,  // ✅ 如果 segment_number 是 null，使用 id
```

---

## 📝 完整的修改后代码

参考文件：`ui.html.FIX_null_segment_number.js`

**关键部分：**

```javascript
function startPolling(sessionId) {
  let lastDataId = 0;  // ✅ 改用 data.id

  pollInterval = setInterval(async () => {
    const data = await fetch(...).then(r => r.json());

    // ✅ 使用 data.id 检测
    if (data && data.is_intermediate && data.id && data.id > lastDataId) {
      console.log('📊 新的数据检测到 (ID:', data.id, ')');

      parent.postMessage({
        pluginMessage: {
          type: 'update-segment-summary',
          data: {
            segmentNumber: data.segment_number || data.id,  // ✅ 兼容
            summary: data.summary,
            decisions: data.decision,
            // ...
          }
        }
      }, '*');

      lastDataId = data.id;  // ✅ 更新 ID
    }
  }, 2000);
}
```

---

## 🧪 测试验证

修改后，重新开始录音，你应该看到：

```
📡 轮询 #1 - Session: 1761100563575
📡 轮询 #2 - Session: 1761100563575
...
📡 轮询 #150 - Session: 1761100563575
📊 新的数据检测到 (ID: 493 )  ← ✅ 成功检测！
📤 发送 update-segment-summary 消息
✅ lastDataId 更新为: 493
```

Figma Console 应该看到：
```
🔨 Received message: update-segment-summary
📊 Received segment summary: 493
✅ Added segment 493 summary card
```

Figma Canvas 应该看到：
```
📊 Segment 493 (5 min)
```

---

## 🔧 根本解决方案（可选）

如果你想修复 `segment_number` 保存问题，需要检查：

### 1. 检查 record.html 或 /api/summarize

确保调用 /api/save 时传递了 `segment_number`：

```javascript
// 在 record.html 或 /api/summarize 中
let segmentCounter = 1;  // 全局计数器

// 每次保存时
await fetch('/api/save', {
  method: 'POST',
  body: JSON.stringify({
    session_id: sessionId,
    transcript: transcript,
    summary: summary,
    decision: decisions,
    explicit: explicit,
    tacit: tacit,
    reasoning: reasoning,
    suggestions: suggestions,
    is_intermediate: true,
    segment_number: segmentCounter,  // ✅ 传递 segment_number
    segment_count: totalSegments,
    duration_minutes: intervalMin
  })
});

segmentCounter++;  // 递增
```

### 2. 检查 /api/save.js

确保正确保存 `segment_number`：

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
  is_intermediate: is_intermediate || false
};

// ✅ 确保这些字段被添加
if (segment_number !== undefined) saveData.segment_number = segment_number;
if (segment_count !== undefined) saveData.segment_count = segment_count;
if (duration_minutes !== undefined) saveData.duration_minutes = duration_minutes;
```

---

## 📊 两种方案对比

| 方案 | 修改量 | 效果 | 推荐度 |
|------|--------|------|--------|
| **使用 data.id** | 少（只改 ui.html） | ✅ 立即可用 | ⭐⭐⭐⭐⭐ |
| **修复 segment_number** | 多（改多个文件） | ✅ 更规范 | ⭐⭐⭐ |

---

## 🎯 推荐做法

1. **立即使用方案 1**（使用 `data.id`）
   - 快速解决问题
   - 不需要修改后端代码
   - 功能完全相同

2. **以后有时间再考虑方案 2**（修复 `segment_number`）
   - 如果你需要更规范的数据结构
   - 如果你想要明确的 segment 编号

---

## 🚀 如何应用修改

### 步骤 1: 修改 ui.html

1. 打开 `ui.html`
2. 找到 `function startPolling(sessionId)` (第 3237 行)
3. 按照上面的修改点 1-4 进行修改
4. 或者直接替换整个函数为 `ui.html.FIX_null_segment_number.js` 中的代码

### 步骤 2: 保存并刷新

1. 保存 `ui.html`
2. 关闭 Figma 插件
3. 重新打开插件
4. 开始新的录音测试

### 步骤 3: 验证

检查 UI Console，应该看到：
```
📊 新的数据检测到 (ID: xxx )
```

检查 Figma Console，应该看到：
```
🔨 Received message: update-segment-summary
📊 Received segment summary: xxx
```

检查 Figma Canvas，应该出现 segment card。

---

## ⚠️ 常见问题

### Q: 使用 data.id 会有什么问题吗？

A: 不会。`data.id` 是 Supabase 自动生成的主键，保证递增且唯一。

### Q: Segment 编号会显示成 493 而不是 1 吗？

A: 是的，但这不影响功能。如果你想显示成 1, 2, 3...，可以在 code.ts 中重新编号：

```typescript
// 在 code.ts 中
let displaySegmentNumber = 1;

async function handleSegmentSummary(data: any) {
  // 使用 displaySegmentNumber 而不是 data.segmentNumber
  await canvasManager.addSegmentSummaryCard({
    segmentNumber: displaySegmentNumber,  // ✅ 使用本地计数
    summary: data.summary,
    // ...
  });

  displaySegmentNumber++;
}
```

### Q: 如果我以后修复了 segment_number，需要改回去吗？

A: 不需要！当前的代码已经兼容：

```javascript
segmentNumber: data.segment_number || data.id
```

- 如果 `segment_number` 有值，使用它
- 如果是 `null`，使用 `data.id`
- 两种情况都能正常工作

---

## 📝 总结

**问题**：`segment_number` 为 `null`，导致检测逻辑失败

**快速解决**：使用 `data.id` 代替 `segment_number`

**修改量**：4 处修改，约 5 分钟

**效果**：立即可用，无需修改后端

**推荐**：⭐⭐⭐⭐⭐

马上试试吧！🚀
