# Supabase 数据同步实现方案

## 📋 目标

让 Figma 插件的 code.ts 存储 Supabase 的数据，并在 canvas 上正确显示：
- **Realtime Meeting Canvas**: 显示 decision summary (中间结果)
- **Final Meeting Canvas**: 显示 final summary (最终结果)

---

## 🔄 当前数据流分析

### 现状：

```
Supabase (sessions 表)
  ↓
  数据结构：
  {
    session_id: "...",
    transcript: "完整对话",
    summary: "本段摘要",
    decision: ["决策1", "决策2"],     // 数组
    explicit: ["显性知识1"],          // 数组
    tacit: ["隐性知识1"],             // 数组
    reasoning: "推理过程",
    suggestions: ["建议1"],           // 数组
    is_intermediate: true/false,      // true=中间结果, false/undefined=最终结果
    is_final: true/false,             // true=最终结果
    segment_number: 1,                // 第几段
    duration_minutes: 5,
    speaker_count: 3
  }
  ↓
ui.html 轮询 (每2秒)
  fetch(`/api/get?session=${sessionId}`)
  ↓
ui.html 当前逻辑：
  ❌ 只传递单个 decision: {decision: "...", owner: "..."}
  ❌ 没有传递 summary, explicit, tacit, reasoning
  ❌ 没有区分 intermediate vs final
  ↓
code.ts 当前逻辑：
  ❌ 只接收单个 decision
  ❌ 只创建小的 decision card
  ❌ 没有存储完整的 Supabase 数据
```

### 问题：

1. **ui.html 只传递单个 decision**，没有传递完整的 summary 数据
2. **code.ts 只创建单个 decision cards**，没有显示完整的段落摘要
3. **code.ts 没有存储 Supabase 的完整数据结构**
4. **final canvas 没有使用 Supabase 的 final summary**

---

## ✅ 新的数据流设计

### 修改后的流程：

```
Supabase (sessions 表)
  ├─ Intermediate Result (is_intermediate: true)
  │   ├─ summary: "0-5分钟的摘要"
  │   ├─ decision: ["决策1", "决策2"]
  │   ├─ explicit: ["显性知识"]
  │   ├─ tacit: ["隐性知识"]
  │   ├─ reasoning: "推理"
  │   └─ suggestions: ["建议"]
  │
  └─ Final Result (is_final: true)
      ├─ summary: "整个会议的完整摘要"
      ├─ decision: ["所有决策"]
      ├─ explicit: ["所有显性知识"]
      ├─ tacit: ["所有隐性知识"]
      ├─ reasoning: "完整推理"
      └─ suggestions: ["所有建议"]
  ↓
ui.html 轮询
  1. 获取完整数据
  2. 识别是 intermediate 还是 final
  3. 传递完整数据结构给 code.ts
  ↓
  发送消息：
  {
    type: 'update-meeting-data',  // 新消息类型
    data: {
      sessionId: "...",
      isFinal: false,              // 是否最终结果
      isIntermediate: true,        // 是否中间结果
      segmentNumber: 1,            // 第几段
      summary: "段落摘要",
      decisions: [...],            // 决策数组
      explicit: [...],             // 显性知识数组
      tacit: [...],                // 隐性知识数组
      reasoning: "推理",
      suggestions: [...],          // 建议数组
      transcript: "对话文本",
      timestamp: "2025-10-22T10:30:00Z"
    }
  }
  ↓
code.ts 接收并处理
  1. 存储完整数据到 meetingData 对象
  2. 如果是 intermediate:
     → 在 Realtime Canvas 创建 Summary Card（包含 summary + decisions）
  3. 如果是 final:
     → 在 Final Canvas 创建完整摘要（包含所有数据）
```

---

## 📝 实现步骤

### Step 1: 修改 ui.html 的轮询逻辑

**位置**: `ui.html` 第 3237 行 `startPolling()` 函数

**修改内容**:

```javascript
function startPolling(sessionId) {
  let lastSegmentNumber = 0;  // 跟踪已处理的段落
  let lastFinalData = null;   // 跟踪最终结果

  pollInterval = setInterval(async () => {
    try {
      // 1. 获取 Supabase 数据
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/get?session=${sessionId}`);
      const data = await res.json();

      if (!data) return;

      // 2. 检查是否有新的中间结果
      if (data.is_intermediate && data.segment_number > lastSegmentNumber) {
        console.log('📊 新的中间结果:', data.segment_number);

        // 发送完整数据给 code.ts
        parent.postMessage({
          pluginMessage: {
            type: 'update-meeting-data',
            data: {
              sessionId: sessionId,
              isFinal: false,
              isIntermediate: true,
              segmentNumber: data.segment_number,
              summary: data.summary || '',
              decisions: Array.isArray(data.decision) ? data.decision : [],
              explicit: Array.isArray(data.explicit) ? data.explicit : [],
              tacit: Array.isArray(data.tacit) ? data.tacit : [],
              reasoning: data.reasoning || '',
              suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
              transcript: data.transcript || '',
              timestamp: new Date().toISOString(),
              durationMinutes: data.duration_minutes || 0,
              speakerCount: data.speaker_count || 0
            }
          }
        }, '*');

        lastSegmentNumber = data.segment_number;

        // 更新 formData
        formData.results = {
          ...formData.results,
          latestSegment: data
        };
      }

      // 3. 检查是否有最终结果
      if (data.is_final && JSON.stringify(data) !== JSON.stringify(lastFinalData)) {
        console.log('🎯 最终结果接收');

        // 发送最终数据给 code.ts
        parent.postMessage({
          pluginMessage: {
            type: 'update-meeting-data',
            data: {
              sessionId: sessionId,
              isFinal: true,
              isIntermediate: false,
              summary: data.summary || '',
              decisions: Array.isArray(data.decision) ? data.decision : [],
              explicit: Array.isArray(data.explicit) ? data.explicit : [],
              tacit: Array.isArray(data.tacit) ? data.tacit : [],
              reasoning: data.reasoning || '',
              suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
              transcript: data.transcript || '',
              timestamp: new Date().toISOString(),
              durationMinutes: data.duration_minutes || 0,
              speakerCount: data.speaker_count || 0
            }
          }
        }, '*');

        lastFinalData = data;

        // 停止轮询
        clearInterval(pollInterval);

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
      console.error('轮询错误:', err);
    }
  }, 2000);
}
```

---

### Step 2: 修改 code.ts 的数据存储

**位置**: `code.ts` 添加全局数据存储

**添加内容**:

```typescript
// 添加到文件顶部，在 meetingStats 附近
interface MeetingData {
  sessionId: string;
  segments: SegmentData[];  // 所有中间段落
  finalData: FinalData | null;  // 最终结果
}

interface SegmentData {
  segmentNumber: number;
  summary: string;
  decisions: string[];
  explicit: string[];
  tacit: string[];
  reasoning: string;
  suggestions: string[];
  transcript: string;
  timestamp: string;
  durationMinutes: number;
  speakerCount: number;
}

interface FinalData {
  summary: string;
  decisions: string[];
  explicit: string[];
  tacit: string[];
  reasoning: string;
  suggestions: string[];
  transcript: string;
  timestamp: string;
  durationMinutes: number;
  speakerCount: number;
}

// 全局存储对象
let meetingData: MeetingData = {
  sessionId: '',
  segments: [],
  finalData: null
};
```

---

### Step 3: 修改 code.ts 的消息处理

**位置**: `code.ts` 第 848 行 `figma.ui.onmessage`

**添加新的 case**:

```typescript
figma.ui.onmessage = async (msg) => {
  console.log('🔨 Received message:', msg.type);

  try {
    switch (msg.type) {
      // ... 现有的 cases ...

      case 'update-meeting-data':
        await updateMeetingData(msg.data);
        break;

      // ... 其他 cases ...
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
};
```

---

### Step 4: 实现 updateMeetingData 函数

**位置**: `code.ts` 添加新函数

**添加内容**:

```typescript
// 处理来自 Supabase 的会议数据
async function updateMeetingData(data: any) {
  console.log('📊 Updating meeting data:', data);

  // 更新 session ID
  if (data.sessionId) {
    meetingData.sessionId = data.sessionId;
  }

  // 处理中间结果
  if (data.isIntermediate) {
    // 检查是否已存在该段落
    const existingIndex = meetingData.segments.findIndex(
      s => s.segmentNumber === data.segmentNumber
    );

    const segmentData: SegmentData = {
      segmentNumber: data.segmentNumber,
      summary: data.summary || '',
      decisions: data.decisions || [],
      explicit: data.explicit || [],
      tacit: data.tacit || [],
      reasoning: data.reasoning || '',
      suggestions: data.suggestions || [],
      transcript: data.transcript || '',
      timestamp: data.timestamp || new Date().toISOString(),
      durationMinutes: data.durationMinutes || 0,
      speakerCount: data.speakerCount || 0
    };

    if (existingIndex >= 0) {
      // 更新现有段落
      meetingData.segments[existingIndex] = segmentData;
    } else {
      // 添加新段落
      meetingData.segments.push(segmentData);
    }

    // 在 Realtime Canvas 上创建/更新 Summary Card
    await canvasManager.addSegmentSummaryCard(segmentData);

    // 更新统计
    updateMeetingStats(segmentData);
  }

  // 处理最终结果
  if (data.isFinal) {
    meetingData.finalData = {
      summary: data.summary || '',
      decisions: data.decisions || [],
      explicit: data.explicit || [],
      tacit: data.tacit || [],
      reasoning: data.reasoning || '',
      suggestions: data.suggestions || [],
      transcript: data.transcript || '',
      timestamp: data.timestamp || new Date().toISOString(),
      durationMinutes: data.durationMinutes || 0,
      speakerCount: data.speakerCount || 0
    };

    console.log('✅ Final data stored, ready to generate final summary');
  }
}

// 更新会议统计
function updateMeetingStats(segment: SegmentData) {
  // 更新决策数量
  meetingStats.decisions = meetingData.segments.reduce(
    (total, seg) => total + seg.decisions.length, 0
  );

  // 更新参与者
  if (segment.speakerCount > 0) {
    meetingStats.speakers = new Set(
      Array.from({ length: segment.speakerCount }, (_, i) => `Speaker ${i + 1}`)
    );
  }

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
}
```

---

### Step 5: 修改 Realtime Canvas 显示逻辑

**位置**: `code.ts` 在 CanvasManager 类中添加新方法

**添加内容**:

```typescript
class CanvasManager {
  // ... 现有代码 ...

  // 新方法：添加段落摘要卡片
  async addSegmentSummaryCard(segment: SegmentData): Promise<void> {
    if (!this.realtimeFrame) {
      console.warn('Realtime canvas not initialized');
      return;
    }

    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    // 创建段落摘要卡片（更大的卡片）
    const cardFrame = figma.createFrame();
    cardFrame.name = `Segment ${segment.segmentNumber} Summary`;
    cardFrame.resize(560, 400);  // 更大的卡片
    cardFrame.cornerRadius = 12;
    cardFrame.fills = [{
      type: 'SOLID',
      color: { r: 0.95, g: 0.97, b: 1 }  // 淡蓝色背景
    }];
    cardFrame.layoutMode = 'VERTICAL';
    cardFrame.paddingLeft = 20;
    cardFrame.paddingRight = 20;
    cardFrame.paddingTop = 20;
    cardFrame.paddingBottom = 20;
    cardFrame.itemSpacing = 12;

    // 标题：段落编号和时间
    const headerText = figma.createText();
    headerText.fontName = { family: 'Inter', style: 'Bold' };
    headerText.fontSize = 16;
    headerText.characters = `📊 Segment ${segment.segmentNumber} (${segment.durationMinutes} min)`;
    headerText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
    cardFrame.appendChild(headerText);

    // 摘要内容
    if (segment.summary) {
      const summaryText = figma.createText();
      summaryText.fontName = { family: 'Inter', style: 'Regular' };
      summaryText.fontSize = 14;
      summaryText.characters = `📝 Summary:\n${segment.summary}`;
      summaryText.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }];
      summaryText.resize(520, summaryText.height);
      cardFrame.appendChild(summaryText);
    }

    // 决策列表
    if (segment.decisions.length > 0) {
      const decisionsText = figma.createText();
      decisionsText.fontName = { family: 'Inter', style: 'Regular' };
      decisionsText.fontSize = 13;
      const decisionsContent = segment.decisions
        .map((d, i) => `  ${i + 1}. ${d}`)
        .join('\n');
      decisionsText.characters = `🎯 Decisions:\n${decisionsContent}`;
      decisionsText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 0.2 } }];
      decisionsText.resize(520, decisionsText.height);
      cardFrame.appendChild(decisionsText);
    }

    // 显性知识
    if (segment.explicit.length > 0) {
      const explicitText = figma.createText();
      explicitText.fontName = { family: 'Inter', style: 'Regular' };
      explicitText.fontSize = 12;
      explicitText.characters = `💡 Explicit: ${segment.explicit.join(', ')}`;
      explicitText.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
      explicitText.resize(520, explicitText.height);
      cardFrame.appendChild(explicitText);
    }

    // 隐性知识
    if (segment.tacit.length > 0) {
      const tacitText = figma.createText();
      tacitText.fontName = { family: 'Inter', style: 'Regular' };
      tacitText.fontSize = 12;
      tacitText.characters = `🧠 Tacit: ${segment.tacit.join(', ')}`;
      tacitText.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
      tacitText.resize(520, tacitText.height);
      cardFrame.appendChild(tacitText);
    }

    // 添加到 realtime canvas
    // 计算位置：垂直堆叠
    const yOffset = 150 + (segment.segmentNumber - 1) * 420;  // 150 = header height, 420 = card + gap
    cardFrame.x = 50;
    cardFrame.y = yOffset;

    this.realtimeFrame.appendChild(cardFrame);

    // 调整 realtime canvas 大小以容纳所有卡片
    const newHeight = Math.max(800, yOffset + 450);
    this.realtimeFrame.resize(1200, newHeight);

    console.log(`✅ Added segment ${segment.segmentNumber} summary card`);
  }
}
```

---

### Step 6: 修改 Final Canvas 使用 Supabase 数据

**位置**: `code.ts` 修改 `generateFinalSummary` 函数

**修改内容**:

```typescript
// 修改现有的 generateFinalSummary 函数
async function generateFinalSummary() {
  console.log('🎯 Generating final summary with Supabase data');

  // 检查是否有最终数据
  if (!meetingData.finalData) {
    console.warn('No final data available, using segments');
    // 如果没有最终数据，使用所有段落数据合并
    const combinedData = {
      summary: meetingData.segments.map(s => s.summary).join('\n\n'),
      decisions: meetingData.segments.flatMap(s => s.decisions),
      explicit: meetingData.segments.flatMap(s => s.explicit),
      tacit: meetingData.segments.flatMap(s => s.tacit),
      reasoning: meetingData.segments.map(s => s.reasoning).filter(r => r).join('\n'),
      suggestions: meetingData.segments.flatMap(s => s.suggestions)
    };
    meetingData.finalData = {
      ...combinedData,
      transcript: meetingData.segments.map(s => s.transcript).join('\n'),
      timestamp: new Date().toISOString(),
      durationMinutes: meetingData.segments.reduce((sum, s) => sum + s.durationMinutes, 0),
      speakerCount: Math.max(...meetingData.segments.map(s => s.speakerCount))
    };
  }

  // 使用 finalData 创建摘要
  await canvasManager.createFinalSummaryWithData(meetingData.finalData);

  figma.notify('✅ Final summary created with Supabase data!');
}
```

**在 CanvasManager 类中添加**:

```typescript
class CanvasManager {
  // ... 现有代码 ...

  async createFinalSummaryWithData(finalData: FinalData): Promise<void> {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'SemiBold' });

    const date = new Date().toLocaleDateString();
    const frame = figma.createFrame();
    frame.name = `Meeting Summary - ${date}`;
    frame.resize(1000, 1200);
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    frame.layoutMode = 'VERTICAL';
    frame.paddingLeft = 40;
    frame.paddingRight = 40;
    frame.paddingTop = 40;
    frame.paddingBottom = 40;
    frame.itemSpacing = 24;

    // 标题
    const titleText = figma.createText();
    titleText.fontName = { family: 'Inter', style: 'Bold' };
    titleText.fontSize = 28;
    titleText.characters = '📋 Meeting Summary';
    titleText.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
    frame.appendChild(titleText);

    // 元数据
    const metaText = figma.createText();
    metaText.fontName = { family: 'Inter', style: 'Regular' };
    metaText.fontSize = 14;
    metaText.characters = `Date: ${date} | Duration: ${finalData.durationMinutes} min | Speakers: ${finalData.speakerCount}`;
    metaText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
    frame.appendChild(metaText);

    // 分隔线
    const divider1 = figma.createLine();
    divider1.resize(920, 0);
    divider1.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
    frame.appendChild(divider1);

    // 📊 Executive Summary
    const summarySection = this.createSectionText(
      '📊 Executive Summary',
      finalData.summary || 'No summary available'
    );
    frame.appendChild(summarySection);

    // 🎯 Key Decisions
    if (finalData.decisions.length > 0) {
      const decisionsContent = finalData.decisions
        .map((d, i) => `${i + 1}. ${d}`)
        .join('\n');
      const decisionsSection = this.createSectionText(
        '🎯 Key Decisions',
        decisionsContent
      );
      frame.appendChild(decisionsSection);
    }

    // 💡 Explicit Knowledge
    if (finalData.explicit.length > 0) {
      const explicitContent = finalData.explicit
        .map((e, i) => `• ${e}`)
        .join('\n');
      const explicitSection = this.createSectionText(
        '💡 Explicit Knowledge',
        explicitContent
      );
      frame.appendChild(explicitSection);
    }

    // 🧠 Tacit Knowledge
    if (finalData.tacit.length > 0) {
      const tacitContent = finalData.tacit
        .map((t, i) => `• ${t}`)
        .join('\n');
      const tacitSection = this.createSectionText(
        '🧠 Tacit Knowledge',
        tacitContent
      );
      frame.appendChild(tacitSection);
    }

    // 🤔 Reasoning
    if (finalData.reasoning) {
      const reasoningSection = this.createSectionText(
        '🤔 Strategic Reasoning',
        finalData.reasoning
      );
      frame.appendChild(reasoningSection);
    }

    // 💬 Suggestions
    if (finalData.suggestions.length > 0) {
      const suggestionsContent = finalData.suggestions
        .map((s, i) => `• ${s}`)
        .join('\n');
      const suggestionsSection = this.createSectionText(
        '💬 Suggestions',
        suggestionsContent
      );
      frame.appendChild(suggestionsSection);
    }

    // 居中显示
    const bounds = figma.viewport.bounds;
    frame.x = bounds.x + (bounds.width - frame.width) / 2;
    frame.y = bounds.y + 100;

    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    console.log('✅ Final summary canvas created with Supabase data');
  }

  // 辅助方法：创建节标题和内容
  private createSectionText(title: string, content: string): FrameNode {
    const sectionFrame = figma.createFrame();
    sectionFrame.layoutMode = 'VERTICAL';
    sectionFrame.itemSpacing = 8;
    sectionFrame.fills = [];

    const titleText = figma.createText();
    titleText.fontName = { family: 'Inter', style: 'SemiBold' };
    titleText.fontSize = 18;
    titleText.characters = title;
    titleText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
    sectionFrame.appendChild(titleText);

    const contentText = figma.createText();
    contentText.fontName = { family: 'Inter', style: 'Regular' };
    contentText.fontSize = 14;
    contentText.characters = content;
    contentText.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }];
    contentText.resize(920, contentText.height);
    sectionFrame.appendChild(contentText);

    return sectionFrame;
  }
}
```

---

## 🎯 总结

### 修改的文件：

1. **ui.html**
   - `startPolling()` 函数：从 Supabase 获取完整数据并传递给 code.ts

2. **code.ts**
   - 添加数据结构：`MeetingData`, `SegmentData`, `FinalData`
   - 添加消息处理：`case 'update-meeting-data'`
   - 添加数据处理函数：`updateMeetingData()`
   - 修改 Realtime Canvas：`addSegmentSummaryCard()`
   - 修改 Final Canvas：`createFinalSummaryWithData()`

### 数据流：

```
Supabase
  ↓ /api/get
ui.html (polling)
  ↓ postMessage('update-meeting-data')
code.ts (meetingData)
  ├─ Intermediate → addSegmentSummaryCard() → Realtime Canvas
  └─ Final → createFinalSummaryWithData() → Final Canvas
```

### 效果：

- ✅ **Realtime Canvas** 显示每个段落的完整 summary（包含 decisions, explicit, tacit）
- ✅ **Final Canvas** 显示最终的完整 summary（来自 Supabase 的 is_final=true 数据）
- ✅ **code.ts** 存储完整的 Supabase 数据结构
- ✅ **数据同步** ui.html ↔ Supabase ↔ code.ts

---

## 📌 下一步

实现这些修改后，你的系统将：
1. 从 Supabase 获取完整数据
2. 在 Realtime Canvas 上显示段落摘要
3. 在 Final Canvas 上显示完整摘要
4. code.ts 存储所有 Supabase 数据

需要我开始实现这些修改吗？
