"use strict";
// // code.ts - Main plugin file with storage support
// figma.showUI(__html__, { 
//   width: 400, 
//   height: 600,
//   title: "AI Meeting Assistant"
// });
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class CanvasManager {
    constructor() {
        this.realtimeFrame = null;
        this.cardPositions = new Map();
        this.currentRow = 0;
        this.currentCol = 0;
        this.timeInterval = 5; // 默认5分钟
        this.CONFIG = {
            CANVAS_WIDTH: 1200,
            CANVAS_HEIGHT: 800,
            CARD_WIDTH: 240,
            CARD_HEIGHT: 140,
            CARD_GAP: 20,
            CARDS_PER_ROW: 3,
            PADDING: 40
        };
    }
    setTimeInterval(interval) {
        this.timeInterval = interval;
        console.log(`📊 Canvas interval set to: ${interval} minutes`);
    }
    initializeRealtimeCanvas() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
                yield figma.loadFontAsync({ family: "Inter", style: "Bold" });
                this.realtimeFrame = figma.createFrame();
                this.realtimeFrame.name = "🔴 Real-time Meeting Canvas";
                this.realtimeFrame.resize(this.CONFIG.CANVAS_WIDTH, this.CONFIG.CANVAS_HEIGHT);
                this.realtimeFrame.fills = [{
                        type: 'SOLID',
                        color: { r: 0.98, g: 0.98, b: 1 }
                    }];
                this.realtimeFrame.strokeWeight = 2;
                this.realtimeFrame.strokes = [{
                        type: 'SOLID',
                        color: { r: 0.2, g: 0.5, b: 1 }
                    }];
                this.realtimeFrame.cornerRadius = 12;
                yield this.addCanvasHeader();
                this.realtimeFrame.x = figma.viewport.center.x - this.CONFIG.CANVAS_WIDTH / 2;
                this.realtimeFrame.y = figma.viewport.center.y - this.CONFIG.CANVAS_HEIGHT / 2;
                figma.currentPage.appendChild(this.realtimeFrame);
                return Promise.resolve();
            }
            catch (error) {
                console.error('Error initializing canvas:', error);
                throw error;
            }
        });
    }
    addCanvasHeader() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.realtimeFrame)
                return;
            const header = figma.createText();
            header.characters = "Real time Meeting Canvas";
            header.fontSize = 24;
            header.fontName = { family: "Inter", style: "Bold" };
            header.fills = [{
                    type: 'SOLID',
                    color: { r: 0.2, g: 0.5, b: 1 }
                }];
            header.x = this.CONFIG.PADDING;
            header.y = this.CONFIG.PADDING;
            this.realtimeFrame.appendChild(header);
            const timeline = figma.createText();
            timeline.characters = `Duration: Every ${this.timeInterval} mins`;
            timeline.fontSize = 14;
            timeline.fontName = { family: "Inter", style: "Regular" };
            timeline.fills = [{
                    type: 'SOLID',
                    color: { r: 0.5, g: 0.5, b: 0.5 }
                }];
            timeline.x = this.CONFIG.PADDING;
            timeline.y = this.CONFIG.PADDING + 40;
            this.realtimeFrame.appendChild(timeline);
        });
    }
    addDecisionCard(card) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.realtimeFrame) {
                yield this.initializeRealtimeCanvas();
            }
            const cardFrame = figma.createFrame();
            cardFrame.name = `Decision ${card.minute}min`;
            cardFrame.resize(this.CONFIG.CARD_WIDTH, this.CONFIG.CARD_HEIGHT);
            const x = this.CONFIG.PADDING + (this.currentCol * (this.CONFIG.CARD_WIDTH + this.CONFIG.CARD_GAP));
            const y = 120 + (this.currentRow * (this.CONFIG.CARD_HEIGHT + this.CONFIG.CARD_GAP));
            cardFrame.x = x;
            cardFrame.y = y;
            cardFrame.fills = [{
                    type: 'SOLID',
                    color: { r: 1, g: 1, b: 1 }
                }];
            cardFrame.strokeWeight = 1;
            cardFrame.strokes = [{
                    type: 'SOLID',
                    color: { r: 0.85, g: 0.85, b: 0.9 }
                }];
            cardFrame.cornerRadius = 8;
            cardFrame.layoutMode = 'VERTICAL';
            cardFrame.paddingTop = 12;
            cardFrame.paddingRight = 12;
            cardFrame.paddingBottom = 12;
            cardFrame.paddingLeft = 12;
            cardFrame.itemSpacing = 8;
            const timestamp = figma.createText();
            timestamp.characters = `${card.minute} min`;
            timestamp.fontSize = 12;
            timestamp.fontName = { family: "Inter", style: "Bold" };
            timestamp.fills = [{
                    type: 'SOLID',
                    color: { r: 0.4, g: 0.4, b: 0.4 }
                }];
            const decisionText = figma.createText();
            decisionText.characters = card.decision.slice(0, 60) + (card.decision.length > 60 ? '...' : '');
            decisionText.fontSize = 13;
            decisionText.fontName = { family: "Inter", style: "Regular" };
            decisionText.layoutAlign = 'STRETCH';
            const ownerText = figma.createText();
            ownerText.characters = `👤 ${card.owner}`;
            ownerText.fontSize = 11;
            ownerText.fontName = { family: "Inter", style: "Regular" };
            ownerText.fills = [{
                    type: 'SOLID',
                    color: { r: 0.5, g: 0.5, b: 0.5 }
                }];
            cardFrame.appendChild(timestamp);
            cardFrame.appendChild(decisionText);
            cardFrame.appendChild(ownerText);
            if (this.realtimeFrame) {
                this.realtimeFrame.appendChild(cardFrame);
            }
            this.currentCol++;
            if (this.currentCol >= this.CONFIG.CARDS_PER_ROW) {
                this.currentCol = 0;
                this.currentRow++;
            }
            this.cardPositions.set(card.id, { x, y });
        });
    }
    addSegmentSummaryCard(segment) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.realtimeFrame) {
                console.warn('⚠️ Realtime canvas not initialized');
                yield this.initializeRealtimeCanvas();
            }
            try {
                yield figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
                yield figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
                // 创建 segment summary card（比 decision card 更大）
                const card = figma.createFrame();
                card.name = `Segment ${segment.segmentNumber} Summary`;
                card.resize(700, 100); // 更大的卡片
                card.cornerRadius = 8;
                card.fills = [{
                        type: 'SOLID',
                        color: { r: 0.96, g: 0.97, b: 1 } // 淡蓝色背景
                    }];
                card.strokeWeight = 1;
                card.strokes = [{
                        type: 'SOLID',
                        color: { r: 0.7, g: 0.75, b: 0.9 }
                    }];
                card.layoutMode = 'VERTICAL';
                card.primaryAxisSizingMode = 'AUTO'; // Auto height
                card.counterAxisSizingMode = 'FIXED'; // Fixed width
                card.paddingLeft = 20;
                card.paddingRight = 20;
                card.paddingTop = 20;
                card.paddingBottom = 20;
                card.itemSpacing = 12;
                // 1. 标题：Segment 编号和时间
                const title = figma.createText();
                title.fontName = { family: 'Inter', style: 'Bold' };
                title.fontSize = 16;
                title.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 0.8 } }];
                title.characters = `📊 Segment ${segment.segmentNumber} (${segment.durationMinutes} min)`;
                title.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
                card.appendChild(title);
                // 2. Summary 内容
                if (segment.summary) {
                    const summaryText = figma.createText();
                    summaryText.fontName = { family: 'Inter', style: 'Regular' };
                    summaryText.fontSize = 13;
                    summaryText.characters = `Summary: ${segment.summary}`;
                    summaryText.layoutAlign = 'STRETCH';
                    summaryText.textAutoResize = 'HEIGHT';
                    card.appendChild(summaryText);
                }
                // 3. Decisions 列表
                if (segment.decisions && segment.decisions.length > 0) {
                    const decisionsTitle = figma.createText();
                    decisionsTitle.fontName = { family: 'Inter', style: 'Bold' };
                    decisionsTitle.fontSize = 12;
                    decisionsTitle.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }];
                    decisionsTitle.characters = '🎯 Decisions:';
                    card.appendChild(decisionsTitle);
                    // Loop through each decision and show its paired explicit and tacit knowledge
                    segment.decisions.forEach((decision, i) => {
                        // Decision text
                        const decisionText = figma.createText();
                        decisionText.fontName = { family: 'Inter', style: 'Bold' };
                        decisionText.fontSize = 12;
                        decisionText.characters = `${i + 1}. ${decision}`;
                        decisionText.layoutAlign = 'STRETCH';
                        decisionText.textAutoResize = 'HEIGHT';
                        card.appendChild(decisionText);
                        // Explicit knowledge for this decision (if exists)
                        if (segment.explicit && segment.explicit[i]) {
                            const explicitText = figma.createText();
                            explicitText.fontName = { family: 'Inter', style: 'Regular' };
                            explicitText.fontSize = 11;
                            explicitText.characters = `   Explicit: ${segment.explicit[i]}`;
                            explicitText.layoutAlign = 'STRETCH';
                            explicitText.textAutoResize = 'HEIGHT';
                            // explicitText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
                            explicitText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 0.9 } }]; // Blue color for Explicit
                            card.appendChild(explicitText);
                        }
                        // Tacit knowledge for this decision (if exists)
                        if (segment.tacit && segment.tacit[i]) {
                            const tacitText = figma.createText();
                            tacitText.fontName = { family: 'Inter', style: 'Regular' };
                            tacitText.fontSize = 11;
                            tacitText.characters = `   Tacit: ${segment.tacit[i]}`;
                            tacitText.layoutAlign = 'STRETCH';
                            tacitText.textAutoResize = 'HEIGHT';
                            //tacitText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
                            tacitText.fills = [{ type: 'SOLID', color: { r: 1.0, g: 0.6, b: 0.2 } }]; // Orange color for Tacit
                            card.appendChild(tacitText);
                        }
                    });
                }
                // 如果有更多决策，显示提示
                //   if (segment.decisions.length > 3) {
                //     const moreText = figma.createText();
                //     moreText.fontName = { family: 'Inter', style: 'Regular' };
                //     moreText.fontSize = 10;
                //     moreText.characters = `   +${segment.decisions.length - 3} more...`;
                //     moreText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
                //     card.appendChild(moreText);
                //   }
                // }
                // // 4. Knowledge (Explicit + Tacit)
                // const knowledgeItems: string[] = [];
                // if (segment.explicit && segment.explicit.length > 0) {
                //   knowledgeItems.push(`💡 ${segment.explicit[0]}`);
                // }
                // if (segment.tacit && segment.tacit.length > 0) {
                //   knowledgeItems.push(`🧠 ${segment.tacit[0]}`);
                // }
                // if (knowledgeItems.length > 0) {
                //   const knowledgeText = figma.createText();
                //   knowledgeText.fontName = { family: 'Inter', style: 'Regular' };
                //   knowledgeText.fontSize = 10;
                //   knowledgeText.characters = knowledgeItems.join('\n');
                //   knowledgeText.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
                //   knowledgeText.resize(500, knowledgeText.height);
                //   card.appendChild(knowledgeText);
                // }
                // 位置：垂直堆叠，每个 segment 占一行
                const yOffset = 150 + (segment.segmentNumber - 1) * 400; // 150 = header height, 340 = card + gap
                card.x = 50;
                card.y = yOffset;
                this.realtimeFrame.appendChild(card);
                // 调整 realtime canvas 大小以容纳所有卡片
                const newHeight = Math.max(800, yOffset + 360);
                this.realtimeFrame.resize(1200, newHeight);
                console.log(`✅ Added segment ${segment.segmentNumber} summary card at y=${yOffset}`);
            }
            catch (error) {
                console.error('❌ Error creating segment summary card:', error);
                throw error;
            }
        });
    }
    createFinalSummaryWithData(finalData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
                yield figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
                yield figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
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
                        .map((d, i) => `${i + 1}. ${d}`)
                        .join('\n\n');
                    this.addSectionToFrame(frame, '🎯 Key Decisions', decisionsContent);
                }
                // 💡 Explicit Knowledge
                if (finalData.explicit && finalData.explicit.length > 0) {
                    const explicitContent = finalData.explicit
                        .map((e, i) => `• ${e}`)
                        .join('\n');
                    this.addSectionToFrame(frame, '💡 Explicit Knowledge', explicitContent);
                }
                // 🧠 Tacit Knowledge
                if (finalData.tacit && finalData.tacit.length > 0) {
                    const tacitContent = finalData.tacit
                        .map((t, i) => `• ${t}`)
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
                        .map((s, i) => `• ${s}`)
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
            }
            catch (error) {
                console.error('❌ Error creating final summary:', error);
                throw error;
            }
        });
    }
    // 辅助方法：添加 section 到 frame
    addSectionToFrame(parent, title, content) {
        // Section 标题
        const titleText = figma.createText();
        titleText.fontName = { family: 'Inter', style: 'Bold' };
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
    createFinalSummary(summary, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
                yield figma.loadFontAsync({ family: "Inter", style: "Bold" });
                const summaryFrame = figma.createFrame();
                summaryFrame.name = `Meeting Summary - ${new Date().toLocaleDateString()}`;
                summaryFrame.resize(900, 800);
                summaryFrame.fills = [{
                        type: 'SOLID',
                        color: { r: 1, g: 1, b: 1 }
                    }];
                summaryFrame.cornerRadius = 12;
                summaryFrame.layoutMode = 'VERTICAL';
                summaryFrame.paddingTop = 40;
                summaryFrame.paddingRight = 40;
                summaryFrame.paddingBottom = 40;
                summaryFrame.paddingLeft = 40;
                summaryFrame.itemSpacing = 32;
                summaryFrame.x = figma.viewport.center.x - 450;
                summaryFrame.y = figma.viewport.center.y - 400;
                // Add title
                const title = figma.createText();
                title.characters = "📋 Meeting Summary";
                title.fontSize = 28;
                title.fontName = { family: "Inter", style: "Bold" };
                summaryFrame.appendChild(title);
                // Add metadata
                const metadata_text = figma.createText();
                metadata_text.characters = `${metadata.module || 'DE4 ERO'} | ${metadata.meetingType || 'Brainstorming'} | ${new Date().toLocaleDateString()}`;
                metadata_text.fontSize = 14;
                metadata_text.fontName = { family: "Inter", style: "Regular" };
                metadata_text.fills = [{
                        type: 'SOLID',
                        color: { r: 0.4, g: 0.4, b: 0.4 }
                    }];
                summaryFrame.appendChild(metadata_text);
                // Add sections
                if (summary.overview) {
                    yield this.addSummarySection(summaryFrame, "📊 Executive Summary", summary.overview);
                }
                if (summary.decisions && summary.decisions.length > 0) {
                    yield this.addSummarySection(summaryFrame, "🎯 Key Decisions", summary.decisions.map((d, i) => `${i + 1}. ${d}`).join('\n'));
                }
                if (summary.actions && summary.actions.length > 0) {
                    yield this.addSummarySection(summaryFrame, "✅ Action Items", summary.actions.map(a => `• ${a}`).join('\n'));
                }
                figma.currentPage.appendChild(summaryFrame);
                figma.currentPage.selection = [summaryFrame];
                figma.viewport.scrollAndZoomIntoView([summaryFrame]);
            }
            catch (error) {
                console.error('Error creating final summary:', error);
                throw error;
            }
        });
    }
    addSummarySection(parent, title, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const section = figma.createFrame();
            section.layoutMode = 'VERTICAL';
            section.counterAxisSizingMode = 'FIXED';
            section.primaryAxisSizingMode = 'AUTO';
            section.layoutAlign = 'STRETCH';
            section.itemSpacing = 12;
            section.fills = [{
                    type: 'SOLID',
                    color: { r: 0.98, g: 0.98, b: 0.98 }
                }];
            section.cornerRadius = 8;
            section.paddingTop = 16;
            section.paddingRight = 16;
            section.paddingBottom = 16;
            section.paddingLeft = 16;
            const sectionTitle = figma.createText();
            sectionTitle.characters = title;
            sectionTitle.fontSize = 18;
            sectionTitle.fontName = { family: "Inter", style: "Bold" };
            const sectionContent = figma.createText();
            sectionContent.characters = content;
            sectionContent.fontSize = 14;
            sectionContent.fontName = { family: "Inter", style: "Regular" };
            sectionContent.layoutAlign = 'STRETCH';
            section.appendChild(sectionTitle);
            section.appendChild(sectionContent);
            parent.appendChild(section);
        });
    }
    clearCanvas() {
        if (this.realtimeFrame) {
            this.realtimeFrame.remove();
            this.realtimeFrame = null;
            this.cardPositions.clear();
            this.currentRow = 0;
            this.currentCol = 0;
        }
    }
}
// =====================================
// Main Plugin Code
// =====================================
const canvasManager = new CanvasManager();
figma.showUI(__html__, {
    width: 400,
    height: 600,
    title: "AI Meeting Assistant"
});
// Storage management
const STORAGE_KEY_PREFIX = 'ai_meeting_';
// Meeting statistics tracking
let meetingStats = {
    decisions: 0,
    actions: 0,
    speakers: new Set(),
    cards: 0,
    startTime: 0,
    currentMinute: 0
};
let meetingData = {
    segments: [], // 所有中间段落
    finalData: null // 最终结果
};
// Initialize canvas on plugin start
function initializePlugin() {
    return __awaiter(this, void 0, void 0, function* () {
        // Send initial stats to UI
        figma.ui.postMessage({
            type: 'update-stats',
            stats: {
                decisions: meetingStats.decisions,
                actions: meetingStats.actions,
                speakers: meetingStats.speakers.size,
                cards: meetingStats.cards
            }
        });
    });
}
// =====================================
// Message Handler - Routes UI messages to appropriate functions
// =====================================
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔨 Received message:', msg.type);
    try {
        switch (msg.type) {
            case 'save-storage':
                yield saveStorage(msg.key, msg.value);
                break;
            case 'load-storage':
                yield loadStorage(msg.key);
                break;
            case 'start-meeting':
                yield startMeeting(msg.data);
                break;
            case 'add-decision':
            case 'add-decision-from-ui':
                yield addDecision(msg.data);
                break;
            case 'stop-recording':
                meetingStats.currentMinute = Math.floor((Date.now() - meetingStats.startTime) / 60000);
                figma.notify(`Recording stopped after ${meetingStats.currentMinute} minutes`);
                break;
            case 'process-recording':
                yield handleRecordingProcess(msg.formData, msg.audioData);
                break;
            case 'insert-summary':
                yield generateFinalSummary();
                break;
            case 'file-upload':
                yield handleFileUpload(msg);
                break;
            case 'update-segment-summary':
                yield handleSegmentSummary(msg.data);
                break;
            case 'final-summary-ready':
                // 存储 final data
                meetingData.finalData = msg.data;
                console.log('✅ Final summary data received and stored');
                figma.notify('📊 Final summary ready!');
                break;
            case 'test':
                figma.notify("✅ Test message received!");
                console.log('Test message handled successfully');
                break;
            default:
                console.log('⚠️ Unknown message type:', msg.type);
        }
    }
    catch (error) {
        console.error('❌ Error handling message:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        figma.notify(`❌ Error: ${errorMessage}`); // ✅ 修复了
    }
});
// =====================================
// Storage Functions
// =====================================
function saveStorage(key, value) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield figma.clientStorage.setAsync(STORAGE_KEY_PREFIX + key, value);
            console.log('💾 Saved to storage:', key);
        }
        catch (error) {
            console.error('❌ Failed to save:', error);
        }
    });
}
function loadStorage(key) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const value = yield figma.clientStorage.getAsync(STORAGE_KEY_PREFIX + key);
            figma.ui.postMessage({
                type: 'storage-loaded',
                key: key,
                value: value
            });
            console.log('📂 Loaded from storage:', key);
        }
        catch (error) {
            console.error('❌ Failed to load:', error);
        }
    });
}
function handleFileUpload(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const fileKey = `${STORAGE_KEY_PREFIX}file_${msg.fileName}`;
            yield figma.clientStorage.setAsync(fileKey, {
                fileName: msg.fileName,
                fileType: msg.fileType,
                fileContent: msg.fileContent,
                uploadedAt: Date.now()
            });
            console.log('📄 File stored:', msg.fileName);
        }
        catch (error) {
            console.error('❌ Failed to store file:', error);
        }
    });
}
// Start meeting and initialize canvas
function startMeeting(data) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            //  const timeInterval = data.timeInterval || 5;  // 默认5分钟
            // console.log(`⏱️ Meeting interval: ${timeInterval} minutes`);
            // canvasManager.setTimeInterval(timeInterval);
            const intervalMin = parseInt(((_b = (_a = data === null || data === void 0 ? void 0 : data.intervalMin) !== null && _a !== void 0 ? _a : data === null || data === void 0 ? void 0 : data.timeInterval) !== null && _b !== void 0 ? _b : 5).toString(), 10);
            console.log(`⏱️ Meeting interval: ${intervalMin} minutes`);
            canvasManager.setTimeInterval(intervalMin);
            // Reset stati
            // stics
            meetingStats = {
                decisions: 0,
                actions: 0,
                speakers: new Set(),
                cards: 0,
                startTime: Date.now(),
                currentMinute: 0,
            };
            // Initialize real-time canvas
            yield canvasManager.initializeRealtimeCanvas();
            // Store meeting metadata
            yield figma.clientStorage.setAsync(`${STORAGE_KEY_PREFIX}current_meeting`, Object.assign(Object.assign({}, data), { intervalMin, startTime: meetingStats.startTime }));
            // Notify UI
            figma.ui.postMessage({
                type: 'meeting-started',
                success: true,
                intervalMin
            });
            figma.notify("✅ Meeting started - Real-time canvas ready");
        }
        catch (error) {
            console.error('Error starting meeting:', error);
            figma.notify("❌ Failed to start meeting");
        }
    });
}
// Add decision to real-time canvas
function addDecision(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            meetingStats.decisions++;
            meetingStats.cards++;
            // Add speaker to set
            if (data.owner) {
                meetingStats.speakers.add(data.owner);
            }
            // Calculate current minute
            const currentMinute = Math.floor((Date.now() - meetingStats.startTime) / 60000);
            // Add card to canvas
            yield canvasManager.addDecisionCard({
                id: `decision_${meetingStats.decisions}`,
                minute: currentMinute,
                decision: data.text,
                owner: data.owner || "Unknown",
                timestamp: Date.now()
            });
            // Update UI statistics
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
        catch (error) {
            console.error('Error adding decision:', error);
        }
    });
}
// Update real-time canvas with new content
// async function updateRealtimeCanvas(data: any) {
//   try {
//     // Process different types of updates
//     if (data.type === 'decision') {
//       await addDecision(data);
//     } else if (data.type === 'action') {
//       meetingStats.actions++;
//       meetingStats.cards++;
//       // Update UI statistics
//       figma.ui.postMessage({
//         type: 'update-stats',
//         stats: {
//           decisions: meetingStats.decisions,
//           actions: meetingStats.actions,
//           speakers: meetingStats.speakers.size,
//           cards: meetingStats.cards
//         }
//       });
//     }
//   } catch (error) {
//     console.error('Error updating canvas:', error);
//   }
// }
// Process recording with AI
function handleRecordingProcess(formData, audioData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            figma.ui.postMessage({
                type: 'processing-start'
            });
            // Simulate AI processing
            yield new Promise(resolve => setTimeout(resolve, 3000));
            // Mock AI analysis results
            const results = {
                overview: `The team discussed ${formData.meetingType} for the ${formData.module} module, focusing on key deliverables and timeline.`,
                decisions: [
                    "Adopt Material Design 3 guidelines for component library",
                    "Set Q2 deadline for accessibility audit completion",
                    "Allocate additional resources to mobile optimization"
                ],
                actions: [
                    "Sarah: Complete wireframes for dashboard redesign (Due: Friday)",
                    "Tom: Review and update component documentation (Due: Next week)",
                    "Team: Conduct usability testing sessions (Due: End of month)"
                ],
                progress: {
                    onTrack: ["Customer discovery completed", "Value proposition defined"],
                    behind: ["Competitive analysis incomplete"],
                    ahead: ["MVP development started early"]
                },
                speakers: ["Sarah", "Tom", "Alice", "Bob"]
            };
            // Save results
            yield figma.clientStorage.setAsync(`${STORAGE_KEY_PREFIX}last_summary`, results);
            // Update statistics
            meetingStats.decisions = results.decisions.length;
            meetingStats.actions = results.actions.length;
            meetingStats.speakers = new Set(results.speakers);
            // Send results to UI
            figma.ui.postMessage({
                type: 'processing-complete',
                results: results,
                stats: {
                    decisions: meetingStats.decisions,
                    actions: meetingStats.actions,
                    speakers: meetingStats.speakers.size,
                    cards: meetingStats.cards
                }
            });
            figma.notify("✅ Recording processed successfully!");
        }
        catch (error) {
            console.error('Processing error:', error);
            figma.ui.postMessage({
                type: 'processing-error',
                error: 'Failed to process recording'
            });
        }
    });
}
// Insert final summary to canvas
// async function insertFinalSummary(data: any) {
//   try {
//     // Get saved summary
//     const summary = await figma.clientStorage.getAsync(`${STORAGE_KEY_PREFIX}last_summary`);
//     if (!summary) {
//       figma.notify("❌ No summary available");
//       return;
//     }
//     // Get meeting metadata
//     const metadata = await figma.clientStorage.getAsync(`${STORAGE_KEY_PREFIX}current_meeting`);
//     // Create final summary on canvas
//     await canvasManager.createFinalSummary(summary, {
//       ...metadata,
//       ...data,
//       week: data.week || 5
//     });
//     figma.notify("✅ Summary inserted to canvas!");
//     // Clear real-time canvas if exists
//     canvasManager.clearCanvas();
//   } catch (error) {
//     console.error('Error inserting summary:', error);
//     figma.notify("❌ Failed to insert summary");
//   }
// }
// 处理 segment summary 数据
function handleSegmentSummary(data) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('📊 Received segment summary:', data.segmentNumber);
        try {
            // 存储 segment data
            meetingData.segments.push(data);
            // 在 Realtime Canvas 显示 segment summary card
            yield canvasManager.addSegmentSummaryCard({
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
            meetingStats.speakers = new Set(Array.from({ length: data.speakerCount || 0 }, (_, i) => `Speaker ${i + 1}`));
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
        }
        catch (error) {
            console.error('❌ Error handling segment summary:', error);
            figma.notify('❌ Failed to add segment summary');
        }
    });
}
function generateFinalSummary() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🎯 Generating final summary with Supabase data');
        try {
            // 检查是否有最终数据
            if (!meetingData.finalData) {
                console.warn('⚠️ No final data available, merging segments');
                // 如果没有最终数据，合并所有 segments
                if (meetingData.segments.length > 0) {
                    // ✅ 使用 ES6 兼容的方式替代 flatMap
                    const allDecisions = [];
                    const allExplicit = [];
                    const allTacit = [];
                    const allSuggestions = [];
                    const reasoningParts = [];
                    // 手动合并数组
                    meetingData.segments.forEach(s => {
                        if (s.decisions) {
                            s.decisions.forEach((d) => allDecisions.push(d));
                        }
                        if (s.explicit) {
                            s.explicit.forEach((e) => allExplicit.push(e));
                        }
                        if (s.tacit) {
                            s.tacit.forEach((t) => allTacit.push(t));
                        }
                        if (s.suggestions) {
                            s.suggestions.forEach((sug) => allSuggestions.push(sug));
                        }
                        if (s.reasoning) {
                            reasoningParts.push(s.reasoning);
                        }
                    });
                    meetingData.finalData = {
                        summary: meetingData.segments.map(s => s.summary).join('\n\n'),
                        decisions: allDecisions,
                        explicit: allExplicit,
                        tacit: allTacit,
                        reasoning: reasoningParts.join('\n'),
                        suggestions: allSuggestions
                    };
                }
                else {
                    figma.notify('❌ No data available for summary');
                    return;
                }
            }
            // 使用 finalData 创建摘要
            yield canvasManager.createFinalSummaryWithData(meetingData.finalData);
            figma.notify('✅ Final summary created with Supabase data!');
        }
        catch (error) {
            console.error('❌ Error generating final summary:', error);
            figma.notify('❌ Failed to generate final summary');
        }
    });
}
// 生成最终摘要
// async function generateFinalSummary() {
//   try {
//     const metadata = await figma.clientStorage.getAsync(`${STORAGE_KEY_PREFIX}current_meeting`);
//     // 创建最终摘要Canvas
//     const summary = {
//       overview: `Meeting completed with ${meetingStats.decisions} decisions and ${meetingStats.actions} action items.`,
//       decisions: [`Total decisions made: ${meetingStats.decisions}`],
//       actions: [`Total action items: ${meetingStats.actions}`],
//       duration: Math.floor((Date.now() - meetingStats.startTime) / 60000),
//       participants: Array.from(meetingStats.speakers)
//     };
//     await canvasManager.createFinalSummary(summary, metadata);
//     figma.notify("✅ Final summary created!");
//   } catch (error) {
//     console.error('Error generating final summary:', error);
//     figma.notify("❌ Failed to generate summary");
//   }
// }
// // Initialize plugin
// initializePlugin();
// // Clean up on close
// figma.on("close", async () => {
//   await figma.clientStorage.setAsync(`${STORAGE_KEY_PREFIX}plugin_state`, {
//     lastUsed: Date.now(),
//     stats: {
//       totalDecisions: meetingStats.decisions,
//       totalActions: meetingStats.actions,
//       totalSpeakers: meetingStats.speakers.size
//     }
//   });
// });
