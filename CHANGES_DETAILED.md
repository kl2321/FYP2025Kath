# 详细修改说明 - Supabase 数据同步

## 📋 文件清单

我已经为你创建了两个修改好的副本文件：

1. **`ui.html.MODIFIED_startPolling.js`** - 修改后的 `startPolling()` 函数
2. **`code.ts.MODIFIED_additions.ts`** - 所有需要添加到 code.ts 的新代码

---

## 🔧 修改 1: ui.html

### 📍 位置
**文件**: `ui.html`
**行号**: 第 3237 行
**函数**: `startPolling(sessionId)`

### ✏️ 修改内容

#### 改动 1.1: 新增变量（第 3238-3241 行）

**原代码**:
```javascript
let lastTranscript = '';          // 上次处理的transcript
let lastDecisions = [];           // 累积的决策列表
let pollTimeoutId = null;
let pollCount = 0;
```

**修改为**:
```javascript
let lastSegmentNumber = 0;        // 【新增】跟踪已处理的segment编号
let lastFinalData = null;         // 【新增】跟踪最终结果
let pollTimeoutId = null;
let pollCount = 0;
```

**说明**:
- 删除 `lastTranscript` 和 `lastDecisions`（不再需要）
- 新增 `lastSegmentNumber` 跟踪 Supabase 的 segment_number
- 新增 `lastFinalData` 跟踪最终结果，避免重复处理

---

#### 改动 1.2: 检测中间结果（第 3271-3340 行）

**原代码**:
```javascript
// 2. 检查是否有新的transcript内容
if (data && data.transcript) {
  const currentTranscript = data.transcript;
  const hasNewContent = currentTranscript.length > lastTranscript.length;

  if (hasNewContent) {
    // ... 大量的transcript处理逻辑
    // ... 调用 callRealtimeSummarize
    // ... 处理 decisions
  }
}
```

**修改为**:
```javascript
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
```

**说明**:
- **删除**: 所有 transcript 增量检测逻辑（不再需要）
- **删除**: `callRealtimeSummarize` 调用（数据已经在 Supabase）
- **新增**: 检测 `data.is_intermediate` 和 `data.segment_number`
- **新增**: 发送新消息类型 `update-segment-summary`
- **新增**: 传递完整的 Supabase 数据（summary, decisions, explicit, tacit, reasoning, suggestions）
- **关键**: 使用 `data.duration_minutes`，这会根据你的 `intervalMin` 设置自动填充

---

#### 改动 1.3: 检测最终结果（新增代码，插入在改动 1.2 之后）

**原代码**:
```javascript
// 6. 检查是否应该执行总结（基于间隔设置）
const cycleInput = document.getElementById('cycleInput');
const intervalMin = parseInt(cycleInput?.value || '5');
const shouldSummarize = pollCount % (intervalMin * 12) === 0;

if (shouldSummarize && data.transcript) {
  console.log('📊 触发周期性总结...');
  // ...
}

// 7. 如果录音已停止
if (data.recording_stopped || !isExternalRecording) {
  // ...
}
```

**修改为**:
```javascript
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
```

**说明**:
- **删除**: 原来的周期性总结触发逻辑（不再需要）
- **删除**: `recording_stopped` 检测逻辑（使用 `is_final` 代替）
- **新增**: 检测 `data.is_final` 标志
- **新增**: 发送 `final-summary-ready` 消息
- **新增**: 发送完整的最终数据
- **新增**: 自动停止轮询并触发 `insert-summary`

---

### 📊 ui.html 总结

| 项目 | 原代码 | 修改后 |
|------|--------|--------|
| **变量** | lastTranscript, lastDecisions | lastSegmentNumber, lastFinalData |
| **数据源** | 实时分析 transcript 增量 | Supabase 的 is_intermediate 数据 |
| **消息类型** | add-decision (单个) | update-segment-summary (完整) |
| **时间间隔** | 硬编码 5 分钟 | 使用 data.duration_minutes（动态） |
| **最终结果** | recording_stopped 触发 | is_final 触发 |
| **代码行数** | ~170 行 | ~80 行（简化了！） |

---

## 🔧 修改 2: code.ts

### 📍 位置和修改内容

#### 改动 2.1: 新增全局数据存储（第 820 行之后）

**位置**: 在 `meetingStats` 定义之后

**添加**:
```typescript
// 存储从 Supabase 获取的会议数据
let meetingData = {
  segments: [] as any[],      // 所有中间段落
  finalData: null as any      // 最终结果
};
```

**说明**:
- 用于存储所有从 Supabase 接收的数据
- `segments`: 存储所有中间结果（is_intermediate: true）
- `finalData`: 存储最终结果（is_final: true）

---

#### 改动 2.2: 添加新消息处理（第 852-894 行）

**位置**: `figma.ui.onmessage` 的 `switch` 语句内

**在现有的 `case` 语句后添加**:
```typescript
case 'update-segment-summary':
  await handleSegmentSummary(msg.data);
  break;

case 'final-summary-ready':
  // 存储 final data
  meetingData.finalData = msg.data;
  console.log('✅ Final summary data received and stored');
  figma.notify('📊 Final summary ready!');
  break;
```

**说明**:
- `update-segment-summary`: 处理来自 ui.html 的 segment 数据
- `final-summary-ready`: 存储最终数据

---

#### 改动 2.3: 新增 handleSegmentSummary 函数（文件末尾）

**位置**: 在现有的 `generateFinalSummary` 函数之前或之后

**添加**:
```typescript
async function handleSegmentSummary(data: any) {
  console.log('📊 Received segment summary:', data.segmentNumber);

  try {
    // 存储 segment data
    meetingData.segments.push(data);

    // 在 Realtime Canvas 显示 segment summary card
    await canvasManager.addSegmentSummaryCard({
      segmentNumber: data.segmentNumber,
      summary: data.summary,
      decisions: data.decisions || [],
      explicit: data.explicit || [],
      tacit: data.tacit || [],
      reasoning: data.reasoning || '',
      durationMinutes: data.durationMinutes || 5
    });

    // 更新统计
    meetingStats.decisions += (data.decisions || []).length;
    meetingStats.speakers = new Set(
      Array.from({ length: data.speakerCount || 0 }, (_, i) => `Speaker ${i + 1}`)
    );

    // 发送更新到 UI
    figma.ui.postMessage({
      type: 'update-stats',
      stats: {
        decisions: meetingStats.decisions,
        actions: meetingStats.actions,
        speakers: meetingStats.speakers.size,
        cards: meetingStats.cards
      }
    });

    figma.notify(`✅ Segment ${data.segmentNumber} added to canvas`);

  } catch (error) {
    console.error('❌ Error handling segment summary:', error);
    figma.notify('❌ Failed to add segment summary');
  }
}
```

**说明**:
- 接收完整的 segment 数据
- 存储到 `meetingData.segments`
- 调用 `canvasManager.addSegmentSummaryCard()` 显示在 canvas 上
- 更新 meetingStats 并通知 UI

---

#### 改动 2.4: 在 CanvasManager 添加 addSegmentSummaryCard 方法

**位置**: `CanvasManager` 类内部，`addDecisionCard` 方法之后

**添加** (见 `code.ts.MODIFIED_additions.ts` 文件第 87-191 行):
```typescript
async addSegmentSummaryCard(segment: any): Promise<void> {
  // 创建大卡片（540x320）
  // 显示: Segment 编号、时间、summary、decisions、knowledge
  // 垂直堆叠布局
}
```

**说明**:
- 创建比 decision card 更大的卡片（540x320 vs 240x140）
- 显示完整的 summary 内容
- 显示 decisions 列表（最多3个）
- 显示 explicit 和 tacit knowledge
- 使用 `durationMinutes` 显示时间（例如 "Segment 1 (5 min)"）

---

#### 改动 2.5: 修改 generateFinalSummary 函数

**位置**: 找到现有的 `generateFinalSummary` 函数并**替换**

**原代码** (大约):
```typescript
async function generateFinalSummary() {
  // 使用本地 meetingStats 创建摘要
  // ...
}
```

**修改为**:
```typescript
async function generateFinalSummary() {
  console.log('🎯 Generating final summary with Supabase data');

  try {
    // 检查是否有最终数据
    if (!meetingData.finalData) {
      console.warn('⚠️ No final data available, merging segments');

      // 如果没有最终数据，合并所有 segments
      if (meetingData.segments.length > 0) {
        meetingData.finalData = {
          summary: meetingData.segments.map(s => s.summary).join('\n\n'),
          decisions: meetingData.segments.flatMap(s => s.decisions || []),
          explicit: meetingData.segments.flatMap(s => s.explicit || []),
          tacit: meetingData.segments.flatMap(s => s.tacit || []),
          reasoning: meetingData.segments.map(s => s.reasoning).filter(r => r).join('\n'),
          suggestions: meetingData.segments.flatMap(s => s.suggestions || [])
        };
      } else {
        figma.notify('❌ No data available for summary');
        return;
      }
    }

    // 使用 finalData 创建摘要
    await canvasManager.createFinalSummaryWithData(meetingData.finalData);

    figma.notify('✅ Final summary created with Supabase data!');

  } catch (error) {
    console.error('❌ Error generating final summary:', error);
    figma.notify('❌ Failed to generate final summary');
  }
}
```

**说明**:
- **关键修改**: 使用 `meetingData.finalData` 而不是本地 `meetingStats`
- 如果没有 final data，自动合并所有 segments
- 调用新方法 `createFinalSummaryWithData()`

---

#### 改动 2.6: 在 CanvasManager 添加 createFinalSummaryWithData 方法

**位置**: `CanvasManager` 类内部，`addSegmentSummaryCard` 方法之后

**添加** (见 `code.ts.MODIFIED_additions.ts` 文件第 252-362 行):
```typescript
async createFinalSummaryWithData(finalData: any): Promise<void> {
  // 创建大型 frame (900x1200)
  // 显示: Summary, Decisions, Explicit, Tacit, Reasoning, Suggestions
  // 使用 addSectionToFrame 辅助方法
}

private addSectionToFrame(parent: FrameNode, title: string, content: string): void {
  // 添加 section 标题和内容
}
```

**说明**:
- 创建完整的最终摘要 canvas
- 显示所有从 Supabase 获取的数据
- 使用分节显示（Summary, Decisions, Knowledge, Reasoning, Suggestions）
- 自动居中并缩放到视口

---

### 📊 code.ts 总结

| 修改类型 | 位置 | 代码量 |
|---------|------|--------|
| **新增全局变量** | 第 820 行后 | 5 行 |
| **新增消息处理** | switch 语句内 | 8 行 |
| **新增函数** | handleSegmentSummary | 45 行 |
| **新增方法** | addSegmentSummaryCard | 110 行 |
| **修改函数** | generateFinalSummary | 30 行 |
| **新增方法** | createFinalSummaryWithData | 100 行 |
| **新增辅助方法** | addSectionToFrame | 15 行 |
| **总计** | | ~313 行 |

---

## 🚀 如何应用修改

### 步骤 1: 修改 ui.html

1. 打开 `ui.html`
2. 找到第 3237 行的 `function startPolling(sessionId) {`
3. **完全替换**整个函数为 `ui.html.MODIFIED_startPolling.js` 中的内容
4. 保存文件

### 步骤 2: 修改 code.ts

1. 打开 `code.ts`

2. **第 820 行后**（`meetingStats` 定义之后）添加：
   ```typescript
   let meetingData = {
     segments: [] as any[],
     finalData: null as any
   };
   ```

3. **第 852 行附近**（`switch` 语句内）添加两个新 case：
   ```typescript
   case 'update-segment-summary':
     await handleSegmentSummary(msg.data);
     break;

   case 'final-summary-ready':
     meetingData.finalData = msg.data;
     console.log('✅ Final summary data received and stored');
     figma.notify('📊 Final summary ready!');
     break;
   ```

4. **在 `generateFinalSummary` 函数之前**添加 `handleSegmentSummary` 函数
   （从 `code.ts.MODIFIED_additions.ts` 文件复制）

5. **替换现有的 `generateFinalSummary` 函数**
   （从 `code.ts.MODIFIED_additions.ts` 文件复制）

6. **在 `CanvasManager` 类内部**（`addDecisionCard` 方法之后）添加：
   - `addSegmentSummaryCard` 方法
   - `createFinalSummaryWithData` 方法
   - `addSectionToFrame` 方法
   （从 `code.ts.MODIFIED_additions.ts` 文件复制）

7. 保存文件

8. 重新编译: `npm run build`

---

## ✅ 验证修改

### 检查清单

#### ui.html:
- [ ] `startPolling` 函数有 `lastSegmentNumber` 变量
- [ ] 有 `if (data && data.is_intermediate ...)` 检测
- [ ] 发送 `type: 'update-segment-summary'` 消息
- [ ] 有 `if (data && data.is_final ...)` 检测
- [ ] 发送 `type: 'final-summary-ready'` 消息

#### code.ts:
- [ ] 有 `meetingData` 全局变量
- [ ] switch 语句有 `case 'update-segment-summary'`
- [ ] switch 语句有 `case 'final-summary-ready'`
- [ ] 有 `handleSegmentSummary()` 函数
- [ ] `generateFinalSummary()` 使用 `meetingData.finalData`
- [ ] CanvasManager 有 `addSegmentSummaryCard()` 方法
- [ ] CanvasManager 有 `createFinalSummaryWithData()` 方法

---

## 📊 数据流图

```
用户设置 intervalMin = 5
  ↓
record.html 每 5 分钟录制
  ↓
/api/summarize 分析并保存到 Supabase
  {
    is_intermediate: true,
    segment_number: 1,
    duration_minutes: 5,  ← 根据 intervalMin
    summary: "...",
    decision: [...]
  }
  ↓
ui.html 轮询 (每2秒)
  检测 is_intermediate && segment_number > lastSegmentNumber
  ↓
ui.html 发送消息给 code.ts
  type: 'update-segment-summary'
  data: { summary, decisions, explicit, tacit, durationMinutes: 5 }
  ↓
code.ts 接收消息
  → handleSegmentSummary()
  → canvasManager.addSegmentSummaryCard()
  ↓
Realtime Canvas 显示
  "📊 Segment 1 (5 min)"  ← 显示 durationMinutes
  + summary 内容
  + decisions 列表
  + knowledge
  ↓
录音结束，/api/final-analyze 生成最终结果
  {
    is_final: true,
    summary: "完整摘要",
    decision: ["所有决策"]
  }
  ↓
ui.html 检测 is_final: true
  发送 'final-summary-ready' 消息
  ↓
code.ts 存储 finalData
  触发 'insert-summary'
  ↓
code.ts generateFinalSummary()
  → canvasManager.createFinalSummaryWithData(meetingData.finalData)
  ↓
Final Canvas 显示完整摘要
```

---

## 🎯 关键改进

### 与原方案对比

| 方面 | 原代码 | 修改后 |
|------|--------|--------|
| **数据源** | 本地 transcript 增量分析 | Supabase 完整数据 |
| **时间间隔** | 硬编码 5 分钟 | 根据 intervalMin 动态 |
| **Realtime Canvas** | 小的 decision cards | 大的 segment summary cards |
| **Final Canvas** | 本地统计数据 | Supabase final 数据 |
| **代码复杂度** | 高（transcript 处理） | 低（直接使用 Supabase） |
| **Supabase 利用** | 仅存储 | 完全利用（读+写） |

### 优势

1. ✅ **简化逻辑**: 不需要在 ui.html 中处理 transcript 增量
2. ✅ **动态时间**: 根据用户的 `intervalMin` 设置
3. ✅ **完整数据**: 显示 summary + decisions + knowledge
4. ✅ **Supabase 优先**: 真正的 "single source of truth"
5. ✅ **最小改动**: 不修改 Supabase 表格，不修改 API

---

## ⚠️ 注意事项

1. **编译**: 修改 code.ts 后必须运行 `npm run build`
2. **测试**: 建议先在测试环境验证
3. **备份**: 修改前备份原始文件
4. **类型**: 如果 TypeScript 报错，可能需要添加类型定义

---

## 🆘 常见问题

### Q1: segment card 没有显示？
**A**: 检查 ui.html 是否发送了 `update-segment-summary` 消息，查看 console.log

### Q2: 时间显示还是 5 分钟？
**A**: 检查 Supabase 的 `duration_minutes` 字段是否正确保存

### Q3: Final summary 是空的？
**A**: 检查 `meetingData.finalData` 是否有数据，可能需要等待 is_final: true

### Q4: TypeScript 编译错误？
**A**: 确保所有方法都在 CanvasManager 类内部，检查 `private` 关键字

---

## 📝 总结

**修改文件数**: 2 个
**新增代码**: ~390 行
**删除代码**: ~90 行（ui.html 简化）
**净增代码**: ~300 行

**效果**:
- ✅ Realtime Canvas 显示完整的 segment summary（包含 summary + decisions + knowledge）
- ✅ 时间间隔根据 `intervalMin` 动态显示
- ✅ Final Canvas 使用 Supabase 的 is_final 数据
- ✅ 数据流清晰：Supabase → ui.html → code.ts → Canvas

需要我帮你实际应用这些修改吗？或者你有任何疑问？
