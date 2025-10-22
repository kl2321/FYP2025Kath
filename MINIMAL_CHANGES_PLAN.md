# 最小改动方案 - Supabase 数据同步

## ✅ Supabase 表格格式：不需要修改！

你现有的 `sessions` 表已经包含所有需要的字段：

```javascript
{
  session_id: "...",
  transcript: "...",
  summary: "本段摘要",
  decision: ["决策1", "决策2"],        // 数组
  explicit: ["显性知识"],              // 数组
  tacit: ["隐性知识"],                 // 数组
  reasoning: "推理过程",
  suggestions: ["建议"],               // 数组
  is_intermediate: true,               // 中间结果
  is_final: false,                     // 最终结果
  segment_number: 1,                   // 第几段
  duration_minutes: 5,                 // 根据 intervalMin 决定
  speaker_count: 3
}
```

**✅ 不需要修改 Supabase 表格！**

---

## 📝 需要修改的地方（只有 2 处）

### 修改 1: ui.html - startPolling() 函数
**位置**: `ui.html` 第 3237 行

**修改内容**: 在轮询中，当收到新数据时，发送完整的 segment data 而不是单个 decision

**原来的逻辑**:
```javascript
// 只发送单个 decision
parent.postMessage({
  pluginMessage: {
    type: 'add-decision',
    data: { decision: "...", owner: "..." }
  }
}, '*');
```

**新的逻辑**:
```javascript
// 发送完整的 segment data（包含 summary + decisions + knowledge）
if (data.is_intermediate && data.segment_number > lastSegmentNumber) {
  parent.postMessage({
    pluginMessage: {
      type: 'update-segment-summary',
      data: {
        segmentNumber: data.segment_number,
        summary: data.summary || '',
        decisions: data.decision || [],
        explicit: data.explicit || [],
        tacit: data.tacit || [],
        reasoning: data.reasoning || '',
        suggestions: data.suggestions || [],
        durationMinutes: data.duration_minutes || formData.intervalMin,
        speakerCount: data.speaker_count || 0
      }
    }
  }, '*');
  lastSegmentNumber = data.segment_number;
}

// 最终结果
if (data.is_final) {
  parent.postMessage({
    pluginMessage: {
      type: 'final-summary-ready',
      data: {
        summary: data.summary || '',
        decisions: data.decision || [],
        explicit: data.explicit || [],
        tacit: data.tacit || [],
        reasoning: data.reasoning || '',
        suggestions: data.suggestions || [],
        durationMinutes: data.duration_minutes,
        speakerCount: data.speaker_count
      }
    }
  }, '*');
}
```

---

### 修改 2: code.ts - 添加新消息处理
**位置**: `code.ts` 第 848 行 `figma.ui.onmessage`

**添加新的 case**:
```typescript
case 'update-segment-summary':
  await handleSegmentSummary(msg.data);
  break;

case 'final-summary-ready':
  // 存储 final data
  meetingData.finalData = msg.data;
  break;
```

**添加新的处理函数**:
```typescript
// 在文件顶部添加全局存储
let meetingData = {
  segments: [],
  finalData: null
};

// 处理 segment summary
async function handleSegmentSummary(data: any) {
  console.log('📊 Received segment summary:', data.segmentNumber);

  // 存储 segment data
  meetingData.segments.push(data);

  // 在 Realtime Canvas 显示
  await canvasManager.addSegmentSummaryCard({
    segmentNumber: data.segmentNumber,
    summary: data.summary,
    decisions: data.decisions,
    explicit: data.explicit,
    tacit: data.tacit,
    durationMinutes: data.durationMinutes
  });

  // 更新统计
  meetingStats.decisions += data.decisions.length;
  figma.ui.postMessage({
    type: 'update-stats',
    stats: {
      decisions: meetingStats.decisions,
      actions: meetingStats.actions,
      speakers: data.speakerCount,
      cards: meetingStats.cards
    }
  });
}
```

**在 CanvasManager 类添加新方法**:
```typescript
class CanvasManager {
  // ... 现有代码 ...

  async addSegmentSummaryCard(segment: any): Promise<void> {
    if (!this.realtimeFrame) return;

    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    // 创建 segment summary card
    const card = figma.createFrame();
    card.name = `Segment ${segment.segmentNumber}`;
    card.resize(540, 320);
    card.cornerRadius = 8;
    card.fills = [{ type: 'SOLID', color: { r: 0.96, g: 0.97, b: 1 } }];
    card.layoutMode = 'VERTICAL';
    card.paddingLeft = 16;
    card.paddingRight = 16;
    card.paddingTop = 16;
    card.paddingBottom = 16;
    card.itemSpacing = 10;

    // 标题
    const title = figma.createText();
    title.fontName = { family: 'Inter', style: 'Bold' };
    title.fontSize = 14;
    title.characters = `📊 Segment ${segment.segmentNumber} (${segment.durationMinutes} min)`;
    title.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
    card.appendChild(title);

    // Summary
    const summaryText = figma.createText();
    summaryText.fontName = { family: 'Inter', style: 'Regular' };
    summaryText.fontSize = 12;
    summaryText.characters = segment.summary || 'No summary';
    summaryText.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }];
    summaryText.resize(500, summaryText.height);
    card.appendChild(summaryText);

    // Decisions
    if (segment.decisions.length > 0) {
      const decisionsText = figma.createText();
      decisionsText.fontName = { family: 'Inter', style: 'Regular' };
      decisionsText.fontSize = 11;
      const decisionsContent = segment.decisions
        .map((d: string, i: number) => `${i + 1}. ${d}`)
        .join('\n');
      decisionsText.characters = `🎯 Decisions:\n${decisionsContent}`;
      decisionsText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 0.2 } }];
      decisionsText.resize(500, decisionsText.height);
      card.appendChild(decisionsText);
    }

    // 位置：垂直堆叠
    const yOffset = 150 + (segment.segmentNumber - 1) * 340;
    card.x = 50;
    card.y = yOffset;

    this.realtimeFrame.appendChild(card);

    // 调整 canvas 大小
    const newHeight = Math.max(800, yOffset + 360);
    this.realtimeFrame.resize(1200, newHeight);

    console.log(`✅ Added segment ${segment.segmentNumber} card`);
  }
}
```

**修改 generateFinalSummary 函数**:
```typescript
async function generateFinalSummary() {
  console.log('🎯 Generating final summary');

  // 使用存储的 finalData
  if (!meetingData.finalData) {
    console.warn('No final data, using segments');
    // 合并所有 segments
    meetingData.finalData = {
      summary: meetingData.segments.map(s => s.summary).join('\n\n'),
      decisions: meetingData.segments.flatMap(s => s.decisions),
      explicit: meetingData.segments.flatMap(s => s.explicit),
      tacit: meetingData.segments.flatMap(s => s.tacit),
      reasoning: meetingData.segments.map(s => s.reasoning).filter(r => r).join('\n'),
      suggestions: meetingData.segments.flatMap(s => s.suggestions)
    };
  }

  await canvasManager.createFinalSummaryWithData(meetingData.finalData);
  figma.notify('✅ Final summary created!');
}
```

**在 CanvasManager 添加 final summary 方法**:
```typescript
async createFinalSummaryWithData(finalData: any): Promise<void> {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  const date = new Date().toLocaleDateString();
  const frame = figma.createFrame();
  frame.name = `Meeting Summary - ${date}`;
  frame.resize(900, 1000);
  frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  frame.layoutMode = 'VERTICAL';
  frame.paddingLeft = 32;
  frame.paddingRight = 32;
  frame.paddingTop = 32;
  frame.paddingBottom = 32;
  frame.itemSpacing = 20;

  // 标题
  const title = figma.createText();
  title.fontName = { family: 'Inter', style: 'Bold' };
  title.fontSize = 24;
  title.characters = '📋 Meeting Summary';
  title.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
  frame.appendChild(title);

  // Summary
  this.addSection(frame, '📊 Summary', finalData.summary);

  // Decisions
  if (finalData.decisions.length > 0) {
    const decisionsContent = finalData.decisions.map((d, i) => `${i + 1}. ${d}`).join('\n');
    this.addSection(frame, '🎯 Key Decisions', decisionsContent);
  }

  // Explicit Knowledge
  if (finalData.explicit?.length > 0) {
    this.addSection(frame, '💡 Explicit Knowledge', finalData.explicit.join('\n• '));
  }

  // Tacit Knowledge
  if (finalData.tacit?.length > 0) {
    this.addSection(frame, '🧠 Tacit Knowledge', finalData.tacit.join('\n• '));
  }

  // Reasoning
  if (finalData.reasoning) {
    this.addSection(frame, '🤔 Reasoning', finalData.reasoning);
  }

  // 居中
  const bounds = figma.viewport.bounds;
  frame.x = bounds.x + (bounds.width - frame.width) / 2;
  frame.y = bounds.y + 100;

  figma.currentPage.appendChild(frame);
  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);
}

private addSection(parent: FrameNode, title: string, content: string): void {
  const titleText = figma.createText();
  titleText.fontName = { family: 'Inter', style: 'Bold' };
  titleText.fontSize = 16;
  titleText.characters = title;
  titleText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
  parent.appendChild(titleText);

  const contentText = figma.createText();
  contentText.fontName = { family: 'Inter', style: 'Regular' };
  contentText.fontSize = 13;
  contentText.characters = content || 'N/A';
  contentText.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }];
  contentText.resize(836, contentText.height);
  parent.appendChild(contentText);
}
```

---

## 📊 数据流

```
用户设置 intervalMin (例如 5 分钟)
  ↓
record.html 每 intervalMin 分钟发送 transcript 到 /api/summarize
  ↓
/api/summarize 分析并保存到 Supabase
  {
    is_intermediate: true,
    segment_number: 1,
    duration_minutes: 5,  // = intervalMin
    summary: "...",
    decision: [...]
  }
  ↓
ui.html 轮询 (每2秒) /api/get
  ↓
检测到新的 segment (segment_number > lastSegmentNumber)
  ↓
发送 'update-segment-summary' 消息给 code.ts
  ↓
code.ts 在 Realtime Canvas 创建 segment card
  显示: summary + decisions + knowledge
  标题显示: "Segment 1 (5 min)" ← 使用 duration_minutes
  ↓
录音结束，/api/final-analyze 生成最终结果
  {
    is_final: true,
    summary: "完整摘要",
    decision: ["所有决策"]
  }
  ↓
ui.html 检测到 is_final: true
  ↓
发送 'final-summary-ready' 消息给 code.ts
  ↓
code.ts 创建 Final Summary Canvas
```

---

## ✅ 总结

### 修改文件：
1. ✅ **ui.html** - 只修改 `startPolling()` 函数（约 30 行代码）
2. ✅ **code.ts** - 添加 2 个新 case + 2 个新函数（约 150 行代码）

### 不需要修改：
- ❌ Supabase 表格格式（已经完美）
- ❌ /api/get.js
- ❌ /api/save.js
- ❌ record.html

### 效果：
- ✅ Realtime Canvas 显示每个 segment 的完整 summary
- ✅ 时间间隔根据 `intervalMin` 动态决定
- ✅ Final Canvas 显示完整的 final summary
- ✅ 使用 Supabase 数据，不是本地模拟数据

---

## 🚀 下一步

我可以现在开始实现这两处修改。需要我开始吗？
