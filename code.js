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
    // ✅ Add segment summary card from Supabase data
    addSegmentSummaryCard(segment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ensure canvas exists
                if (!this.realtimeFrame) {
                    yield this.initializeRealtimeCanvas();
                }
                // Load fonts
                yield figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
                yield figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
                // Create card frame
                const card = figma.createFrame();
                card.name = `Segment ${segment.segmentNumber} Summary`;
                card.resize(540, 320);
                card.cornerRadius = 8;
                card.fills = [{ type: 'SOLID', color: { r: 0.96, g: 0.97, b: 1 } }];
                card.layoutMode = 'VERTICAL';
                card.paddingLeft = 16;
                card.paddingRight = 16;
                card.paddingTop = 16;
                card.paddingBottom = 16;
                card.itemSpacing = 10;
                // Title with duration
                const title = figma.createText();
                title.fontName = { family: 'Inter', style: 'Bold' };
                title.fontSize = 14;
                title.characters = `📊 Segment ${segment.segmentNumber} (${segment.durationMinutes} min)`;
                card.appendChild(title);
                // Summary text
                const summaryText = figma.createText();
                summaryText.fontName = { family: 'Inter', style: 'Regular' };
                summaryText.fontSize = 12;
                summaryText.characters = segment.summary || 'No summary';
                summaryText.resize(500, summaryText.height);
                card.appendChild(summaryText);
                // Decisions list
                if (segment.decisions && segment.decisions.length > 0) {
                    const decisionsText = figma.createText();
                    decisionsText.fontName = { family: 'Inter', style: 'Regular' };
                    decisionsText.fontSize = 11;
                    const decisionsStr = segment.decisions
                        .map((d, i) => `${i + 1}. ${d}`)
                        .join('\n');
                    decisionsText.characters = `🎯 Decisions:\n${decisionsStr}`;
                    card.appendChild(decisionsText);
                }
                // Position card
                const yOffset = 150 + (segment.segmentNumber - 1) * 340;
                card.x = 50;
                card.y = yOffset;
                console.log(`✅ Added segment ${segment.segmentNumber} summary card at y=${yOffset}`);
                if (this.realtimeFrame) {
                    this.realtimeFrame.appendChild(card);
                }
            }
            catch (error) {
                console.error('❌ Error adding segment summary card:', error);
                throw error;
            }
        });
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
// ✅ Meeting data storage for Supabase sync
let meetingData = {
    segments: [],
    finalData: null
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
            case 'update-segment-summary':
                yield handleSegmentSummary(msg.data);
                break;
            case 'final-summary-ready':
                meetingData.finalData = msg.data;
                console.log('✅ Final summary data received and stored');
                break;
            case 'file-upload':
                yield handleFileUpload(msg);
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
// ✅ Handle segment summary from Supabase
function handleSegmentSummary(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('📊 Received segment summary:', data.segmentNumber);
            // Store segment data
            meetingData.segments.push(data);
            // Add segment summary card to canvas
            yield canvasManager.addSegmentSummaryCard({
                segmentNumber: data.segmentNumber,
                summary: data.summary,
                decisions: data.decisions || [],
                explicit: data.explicit || [],
                tacit: data.tacit || [],
                reasoning: data.reasoning || '',
                durationMinutes: data.durationMinutes || 5
            });
            // Update statistics
            meetingStats.decisions += (data.decisions || []).length;
            console.log('✅ Added segment', data.segmentNumber, 'summary card');
        }
        catch (error) {
            console.error('❌ Failed to handle segment summary:', error);
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
// 生成最终摘要
function generateFinalSummary() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const metadata = yield figma.clientStorage.getAsync(`${STORAGE_KEY_PREFIX}current_meeting`);
            // 创建最终摘要Canvas
            const summary = {
                overview: `Meeting completed with ${meetingStats.decisions} decisions and ${meetingStats.actions} action items.`,
                decisions: [`Total decisions made: ${meetingStats.decisions}`],
                actions: [`Total action items: ${meetingStats.actions}`],
                duration: Math.floor((Date.now() - meetingStats.startTime) / 60000),
                participants: Array.from(meetingStats.speakers)
            };
            yield canvasManager.createFinalSummary(summary, metadata);
            figma.notify("✅ Final summary created!");
        }
        catch (error) {
            console.error('Error generating final summary:', error);
            figma.notify("❌ Failed to generate summary");
        }
    });
}
// Initialize plugin
initializePlugin();
// Clean up on close
figma.on("close", () => __awaiter(void 0, void 0, void 0, function* () {
    yield figma.clientStorage.setAsync(`${STORAGE_KEY_PREFIX}plugin_state`, {
        lastUsed: Date.now(),
        stats: {
            totalDecisions: meetingStats.decisions,
            totalActions: meetingStats.actions,
            totalSpeakers: meetingStats.speakers.size
        }
    });
}));
