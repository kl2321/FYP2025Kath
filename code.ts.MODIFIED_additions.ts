// ========================================
// code.ts 修改内容
// ========================================

// =====================================
// 【新增 1】在文件顶部（第 820 行附近，meetingStats 之后）添加数据存储
// =====================================

// 存储从 Supabase 获取的会议数据
let meetingData = {
  segments: [] as any[],      // 所有中间段落
  finalData: null as any      // 最终结果
};


// =====================================
// 【修改 2】在 figma.ui.onmessage 的 switch 语句中添加新的 case
// 位置：第 848 行 figma.ui.onmessage 函数内
// =====================================

// 在现有的 switch 语句中添加以下两个 case：

case 'update-segment-summary':
  await handleSegmentSummary(msg.data);
  break;

case 'final-summary-ready':
  // 存储 final data
  meetingData.finalData = msg.data;
  console.log('✅ Final summary data received and stored');
  figma.notify('📊 Final summary ready!');
  break;


// =====================================
// 【新增 3】在文件末尾（或 generateFinalSummary 函数之前）添加新函数
// =====================================

// 处理 segment summary 数据
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


// =====================================
// 【新增 4】在 CanvasManager 类中添加新方法
// 位置：CanvasManager 类内部，addDecisionCard 方法之后
// =====================================

async addSegmentSummaryCard(segment: any): Promise<void> {
  if (!this.realtimeFrame) {
    console.warn('⚠️ Realtime canvas not initialized');
    await this.initializeRealtimeCanvas();
  }

  try {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    // 创建 segment summary card（比 decision card 更大）
    const card = figma.createFrame();
    card.name = `Segment ${segment.segmentNumber} Summary`;
    card.resize(540, 320);  // 更大的卡片
    card.cornerRadius = 8;
    card.fills = [{
      type: 'SOLID',
      color: { r: 0.96, g: 0.97, b: 1 }  // 淡蓝色背景
    }];
    card.strokeWeight = 1;
    card.strokes = [{
      type: 'SOLID',
      color: { r: 0.7, g: 0.75, b: 0.9 }
    }];
    card.layoutMode = 'VERTICAL';
    card.paddingLeft = 16;
    card.paddingRight = 16;
    card.paddingTop = 16;
    card.paddingBottom = 16;
    card.itemSpacing = 10;

    // 1. 标题：Segment 编号和时间
    const title = figma.createText();
    title.fontName = { family: 'Inter', style: 'Bold' };
    title.fontSize = 14;
    title.characters = `📊 Segment ${segment.segmentNumber} (${segment.durationMinutes} min)`;
    title.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
    card.appendChild(title);

    // 2. Summary 内容
    if (segment.summary) {
      const summaryText = figma.createText();
      summaryText.fontName = { family: 'Inter', style: 'Regular' };
      summaryText.fontSize = 12;
      summaryText.characters = segment.summary.length > 200
        ? segment.summary.substring(0, 200) + '...'
        : segment.summary;
      summaryText.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }];
      summaryText.resize(500, summaryText.height);
      card.appendChild(summaryText);
    }

    // 3. Decisions 列表
    if (segment.decisions && segment.decisions.length > 0) {
      const decisionsText = figma.createText();
      decisionsText.fontName = { family: 'Inter', style: 'Regular' };
      decisionsText.fontSize = 11;
      const decisionsContent = segment.decisions
        .slice(0, 3)  // 最多显示3个决策
        .map((d: string, i: number) => `  ${i + 1}. ${d.length > 50 ? d.substring(0, 50) + '...' : d}`)
        .join('\n');
      decisionsText.characters = `🎯 Decisions:\n${decisionsContent}`;
      decisionsText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 0.2 } }];
      decisionsText.resize(500, decisionsText.height);
      card.appendChild(decisionsText);

      // 如果有更多决策，显示提示
      if (segment.decisions.length > 3) {
        const moreText = figma.createText();
        moreText.fontName = { family: 'Inter', style: 'Regular' };
        moreText.fontSize = 10;
        moreText.characters = `   +${segment.decisions.length - 3} more...`;
        moreText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
        card.appendChild(moreText);
      }
    }

    // 4. Knowledge (Explicit + Tacit)
    const knowledgeItems: string[] = [];
    if (segment.explicit && segment.explicit.length > 0) {
      knowledgeItems.push(`💡 ${segment.explicit[0]}`);
    }
    if (segment.tacit && segment.tacit.length > 0) {
      knowledgeItems.push(`🧠 ${segment.tacit[0]}`);
    }
    if (knowledgeItems.length > 0) {
      const knowledgeText = figma.createText();
      knowledgeText.fontName = { family: 'Inter', style: 'Regular' };
      knowledgeText.fontSize = 10;
      knowledgeText.characters = knowledgeItems.join('\n');
      knowledgeText.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
      knowledgeText.resize(500, knowledgeText.height);
      card.appendChild(knowledgeText);
    }

    // 位置：垂直堆叠，每个 segment 占一行
    const yOffset = 150 + (segment.segmentNumber - 1) * 340;  // 150 = header height, 340 = card + gap
    card.x = 50;
    card.y = yOffset;

    this.realtimeFrame!.appendChild(card);

    // 调整 realtime canvas 大小以容纳所有卡片
    const newHeight = Math.max(800, yOffset + 360);
    this.realtimeFrame!.resize(1200, newHeight);

    console.log(`✅ Added segment ${segment.segmentNumber} summary card at y=${yOffset}`);

  } catch (error) {
    console.error('❌ Error creating segment summary card:', error);
    throw error;
  }
}


// =====================================
// 【修改 5】修改现有的 generateFinalSummary 函数
// 位置：找到现有的 generateFinalSummary 函数并替换
// =====================================

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


// =====================================
// 【新增 6】在 CanvasManager 类中添加 final summary 创建方法
// 位置：CanvasManager 类内部，addSegmentSummaryCard 方法之后
// =====================================

async createFinalSummaryWithData(finalData: any): Promise<void> {
  try {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'SemiBold' });

    const date = new Date().toLocaleDateString();
    const frame = figma.createFrame();
    frame.name = `Meeting Summary - ${date}`;
    frame.resize(900, 1200);
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    frame.strokeWeight = 2;
    frame.strokes = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
    frame.cornerRadius = 8;
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

    // 📊 Summary
    if (finalData.summary) {
      this.addSectionToFrame(frame, '📊 Summary', finalData.summary);
    }

    // 🎯 Key Decisions
    if (finalData.decisions && finalData.decisions.length > 0) {
      const decisionsContent = finalData.decisions
        .map((d: string, i: number) => `${i + 1}. ${d}`)
        .join('\n\n');
      this.addSectionToFrame(frame, '🎯 Key Decisions', decisionsContent);
    }

    // 💡 Explicit Knowledge
    if (finalData.explicit && finalData.explicit.length > 0) {
      const explicitContent = finalData.explicit
        .map((e: string, i: number) => `• ${e}`)
        .join('\n');
      this.addSectionToFrame(frame, '💡 Explicit Knowledge', explicitContent);
    }

    // 🧠 Tacit Knowledge
    if (finalData.tacit && finalData.tacit.length > 0) {
      const tacitContent = finalData.tacit
        .map((t: string, i: number) => `• ${t}`)
        .join('\n');
      this.addSectionToFrame(frame, '🧠 Tacit Knowledge', tacitContent);
    }

    // 🤔 Reasoning
    if (finalData.reasoning) {
      this.addSectionToFrame(frame, '🤔 Strategic Reasoning', finalData.reasoning);
    }

    // 💬 Suggestions
    if (finalData.suggestions && finalData.suggestions.length > 0) {
      const suggestionsContent = finalData.suggestions
        .map((s: string, i: number) => `• ${s}`)
        .join('\n');
      this.addSectionToFrame(frame, '💬 Suggestions', suggestionsContent);
    }

    // 居中显示
    const bounds = figma.viewport.bounds;
    frame.x = bounds.x + (bounds.width - frame.width) / 2;
    frame.y = bounds.y + 100;

    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    console.log('✅ Final summary canvas created with Supabase data');

  } catch (error) {
    console.error('❌ Error creating final summary:', error);
    throw error;
  }
}

// 辅助方法：添加 section 到 frame
private addSectionToFrame(parent: FrameNode, title: string, content: string): void {
  // Section 标题
  const titleText = figma.createText();
  titleText.fontName = { family: 'Inter', style: 'SemiBold' };
  titleText.fontSize = 16;
  titleText.characters = title;
  titleText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
  parent.appendChild(titleText);

  // Section 内容
  const contentText = figma.createText();
  contentText.fontName = { family: 'Inter', style: 'Regular' };
  contentText.fontSize = 13;
  contentText.characters = content || 'N/A';
  contentText.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }];
  contentText.resize(836, contentText.height);
  parent.appendChild(contentText);
}


// ========================================
// 主要修改点总结：
// ========================================
// 1. 新增 meetingData 全局对象存储 Supabase 数据
// 2. 新增 'update-segment-summary' 消息处理
// 3. 新增 'final-summary-ready' 消息处理
// 4. 新增 handleSegmentSummary() 函数
// 5. 在 CanvasManager 添加 addSegmentSummaryCard() 方法
// 6. 修改 generateFinalSummary() 使用 Supabase 数据
// 7. 在 CanvasManager 添加 createFinalSummaryWithData() 方法
// 8. 在 CanvasManager 添加 addSectionToFrame() 辅助方法
// ========================================
