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
            var _a;
            try {
                yield figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
                yield figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
                // 🔧 unwrap 空 key：如果顶层只有一个空键，展开它
                if (finalData[""] && typeof finalData[""] === "object") {
                    console.log('⚠️ Detected empty key in finalData, unwrapping...');
                    const emptyKeyData = finalData[""];
                    const otherKeys = Object.fromEntries(Object.entries(finalData).filter(([k]) => k !== ""));
                    finalData = Object.assign(Object.assign({}, emptyKeyData), otherKeys);
                    console.log('✅ Unwrapped finalData:', Object.keys(finalData));
                }
                const date = new Date().toLocaleDateString();
                const frame = figma.createFrame();
                frame.name = `Meeting Summary - ${date}`;
                frame.resize(1000, 1400);
                frame.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.99 } }];
                frame.cornerRadius = 16;
                frame.layoutMode = 'VERTICAL';
                frame.paddingLeft = 40;
                frame.paddingRight = 40;
                frame.paddingTop = 40;
                frame.paddingBottom = 40;
                frame.itemSpacing = 24;
                frame.primaryAxisSizingMode = 'AUTO';
                frame.strokeWeight = 2;
                frame.strokes = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
                // 创建标题容器
                const headerFrame = figma.createFrame();
                headerFrame.layoutMode = 'HORIZONTAL';
                headerFrame.counterAxisSizingMode = 'AUTO';
                headerFrame.primaryAxisSizingMode = 'AUTO';
                headerFrame.fills = [];
                headerFrame.itemSpacing = 16;
                const title = figma.createText();
                title.fontName = { family: 'Inter', style: 'Bold' };
                title.fontSize = 32;
                title.characters = '📋 Meeting Summary';
                title.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.2 } }];
                const dateText = figma.createText();
                dateText.fontName = { family: 'Inter', style: 'Regular' };
                dateText.fontSize = 14;
                dateText.characters = date;
                dateText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.6 } }];
                headerFrame.appendChild(title);
                frame.appendChild(headerFrame);
                frame.appendChild(dateText);
                // 检查数据结构类型并处理
                // 🔧 修正：检查 meeting_summary 而不是 duration_overview
                if (finalData.meeting_summary || finalData.decision_summary) {
                    // ========== 新数据结构处理（final_comprehensive JSON 格式）==========
                    // 📊 Meeting Overview
                    if (finalData.meeting_summary) {
                        const ms = finalData.meeting_summary;
                        if (ms.duration_overview) {
                            this.addSectionToFrame(frame, '📊 Duration Overview', ms.duration_overview);
                        }
                        // 📍 Key Topics
                        if (Array.isArray(ms.key_topics_discussed) && ms.key_topics_discussed.length > 0) {
                            const topicsContent = ms.key_topics_discussed
                                .map((topic) => `• ${topic}`)
                                .join('\n');
                            this.addSectionToFrame(frame, '📍 Key Topics Discussed', topicsContent);
                        }
                        // 👥 Team Dynamics
                        if (ms.overall_team_dynamics) {
                            this.addSectionToFrame(frame, '👥 Team Dynamics', ms.overall_team_dynamics);
                        }
                    }
                    // 🎯 Key Decisions with Knowledge
                    if (((_a = finalData.decision_summary) === null || _a === void 0 ? void 0 : _a.decisions) && finalData.decision_summary.decisions.length > 0) {
                        finalData.decision_summary.decisions.forEach((d, i) => {
                            // Decision 主内容
                            let decisionText = `${d.decision || ''}`;
                            if (d.rationale) {
                                decisionText += `\n\nRationale:\n${d.rationale}`;
                            }
                            if (d.impact) {
                                decisionText += `\n\nImpact:\n${d.impact}`;
                            }
                            // 添加 Explicit Knowledge (如果有)
                            if (d.explicit_knowledge && Array.isArray(d.explicit_knowledge) && d.explicit_knowledge.length > 0) {
                                decisionText += `\n\n💡 Explicit Knowledge:\n`;
                                decisionText += d.explicit_knowledge
                                    .map((e) => `• ${e}`)
                                    .join('\n');
                            }
                            // 添加 Tacit Knowledge (如果有)
                            if (d.tacit_knowledge && Array.isArray(d.tacit_knowledge) && d.tacit_knowledge.length > 0) {
                                decisionText += `\n\n🧠 Tacit Knowledge:\n`;
                                decisionText += d.tacit_knowledge
                                    .map((t) => `• ${t}`)
                                    .join('\n');
                            }
                            this.addSectionToFrame(frame, `🎯 Decision ${i + 1}`, decisionText);
                        });
                    }
                    // 📈 Progress Status
                    if (finalData.progress_check) {
                        const pc = finalData.progress_check;
                        // 当前周 & 整体状态
                        if (pc.current_week) {
                            this.addSectionToFrame(frame, '📅 Current Week', pc.current_week);
                        }
                        if (pc.alignment_status) {
                            const statusEmoji = pc.alignment_status === 'on_track' ? '✅' :
                                pc.alignment_status === 'behind' ? '⚠️' : 'ℹ️';
                            this.addSectionToFrame(frame, '📊 Alignment Status', `${statusEmoji} ${pc.alignment_status}`);
                        }
                        // 预期里程碑
                        if (Array.isArray(pc.expected_milestones) && pc.expected_milestones.length > 0) {
                            const expectedContent = pc.expected_milestones
                                .map((m) => `• ${m}`)
                                .join('\n');
                            this.addSectionToFrame(frame, '🎯 Expected Milestones', expectedContent);
                        }
                        // 实际进度
                        if (Array.isArray(pc.actual_progress) && pc.actual_progress.length > 0) {
                            const progressContent = pc.actual_progress
                                .map((p) => `• ${p}`)
                                .join('\n');
                            this.addSectionToFrame(frame, '✅ Progress Achieved', progressContent);
                        }
                        // 缺口
                        if (Array.isArray(pc.gaps_identified) && pc.gaps_identified.length > 0) {
                            const gapsContent = pc.gaps_identified
                                .map((g) => `• ${g}`)
                                .join('\n');
                            this.addSectionToFrame(frame, '⚠️ Gaps Identified', gapsContent);
                        }
                        // 上周 action review
                        if (pc.lastweekaction_review) {
                            const lw = pc.lastweekaction_review;
                            let text = '';
                            if (Array.isArray(lw.previous_actions) && lw.previous_actions.length > 0) {
                                text += 'Previous actions:\n';
                                lw.previous_actions.forEach((a, i) => {
                                    var _a;
                                    const status = ((_a = lw.completion_status) === null || _a === void 0 ? void 0 : _a[i]) ? ` (${lw.completion_status[i]})` : '';
                                    text += `• ${a}${status}\n`;
                                });
                            }
                            if (Array.isArray(lw.blockers_discussed) && lw.blockers_discussed.length > 0) {
                                text += '\nBlockers:\n';
                                text += lw.blockers_discussed.map((b) => `• ${b}`).join('\n');
                            }
                            if (text.trim()) {
                                this.addSectionToFrame(frame, '📎 Last Week Actions Review', text.trim());
                            }
                        }
                    }
                    // 📈 Progress Status
                    // if (finalData.progress_check) {
                    //   // let progressContent = '';
                    //   if (finalData.progress_check.current_week) {
                    //       this.addSectionToFrame(frame, '📅 Current Week', finalData.progress_check.current_week);
                    //   }
                    //   if (finalData.progress_check.alignment_status) {
                    //     const statusEmoji = finalData.progress_check.alignment_status === 'on_track' ? '✅' : '⚠️';
                    //     this.addSectionToFrame(frame, '📊 Alignment Status', `${statusEmoji} ${finalData.progress_check.alignment_status}`);
                    //   }
                    //   if (finalData.progress_check.actual_progress && finalData.progress_check.actual_progress.length > 0) {
                    //      const progressContent = finalData.progress_check.actual_progress
                    //       .map((p: string) => `• ${p}`)
                    //       .join('\n');
                    //        this.addSectionToFrame(frame, '✅ Progress Achieved', progressContent);
                    //   }
                    //   if (finalData.progress_check.gaps_identified && finalData.progress_check.gaps_identified.length > 0) {
                    //      const gapsContent = finalData.progress_check.gaps_identified
                    //       .map((g: string) => `• ${g}`)
                    //       .join('\n');
                    //        this.addSectionToFrame(frame, '⚠️ Gaps Identified', gapsContent);
                    //   }
                    // }
                    // // ✅ Action Items
                    // if (finalData.action_items?.immediatenext_steps && finalData.action_items.immediatenext_steps.length > 0) {
                    //    finalData.action_items.immediatenext_steps.forEach((a: any, i: number) => {
                    //     const priorityEmoji = a.priority === 'high' ? '🔴' : a.priority === 'medium' ? '🟡' : '🟢';
                    //     const actionText = `${a.action}\n\nOwner: ${a.owner}\nDeadline: ${a.deadline}\nPriority: ${priorityEmoji} ${a.priority}`;
                    //     this.addSectionToFrame(frame, `✅ Action Item ${i + 1}`, actionText);
                    //   });
                    // }
                    // // 🎯 Next Week Focus (独立 section)
                    // if (finalData.action_items?.upcomingweek_focus && finalData.action_items.upcomingweek_focus.length > 0) {
                    //   const focusContent = finalData.action_items.upcomingweek_focus
                    //     .map((f: string) => `• ${f}`)
                    //     .join('\n');
                    //   this.addSectionToFrame(frame, '🎯 Next Week Focus', focusContent);
                    // }
                    // ✅ Action Items
                    if (finalData.action_items) {
                        const ai = finalData.action_items;
                        // 1. Immediate next steps (匹配 final_comprehensive 格式：immediate_next_steps)
                        const immediate = ai.immediate_next_steps || ai.immediatenext_steps || ai.immediatenextsteps;
                        if (Array.isArray(immediate) && immediate.length > 0) {
                            immediate.forEach((a, i) => {
                                const priorityEmoji = a.priority === 'high' ? '🔴' :
                                    a.priority === 'medium' ? '🟡' : '🟢';
                                const actionText = `${a.action}\n\n` +
                                    (a.owner ? `Owner: ${a.owner}\n` : '') +
                                    (a.deadline ? `Deadline: ${a.deadline}\n` : '') +
                                    (a.priority ? `Priority: ${priorityEmoji} ${a.priority}` : '');
                                this.addSectionToFrame(frame, `✅ Action Item ${i + 1}`, actionText.trim());
                            });
                        }
                        // 2. Next week focus (匹配 final_comprehensive 格式：upcoming_week_focus)
                        const upcoming = ai.upcoming_week_focus || ai.upcomingweek_focus || ai.upcomingweekfocus;
                        if (Array.isArray(upcoming) && upcoming.length > 0) {
                            const focusContent = upcoming
                                .map((f) => `• ${f}`)
                                .join('\n');
                            this.addSectionToFrame(frame, '🎯 Next Week Focus', focusContent);
                        }
                        // 3. Dependencies
                        if (Array.isArray(ai.dependencies) && ai.dependencies.length > 0) {
                            const depsContent = ai.dependencies
                                .map((d) => `• ${d}`)
                                .join('\n');
                            this.addSectionToFrame(frame, '🔗 Dependencies', depsContent);
                        }
                    }
                    // 📚 Learning Materials
                    if (finalData.learning_materials) {
                        const lm = finalData.learning_materials;
                        // 1. Recommended resources
                        if (lm.recommended_resources && lm.recommended_resources.length > 0) {
                            lm.recommended_resources.forEach((r, i) => {
                                const priorityEmoji = r.priority === 'high' ? '⭐' : '📄';
                                const resourceText = `${priorityEmoji} ${r.title}\n\n` +
                                    (r.resource_type ? `Type: ${r.resource_type}\n` : '') +
                                    (r.url ? `URL: ${r.url}\n` : '') +
                                    (r.relevance ? `Relevance: ${r.relevance}` : '');
                                this.addSectionToFrame(frame, `📚 Resource ${i + 1}`, resourceText);
                            });
                        }
                        // 2. Skill gaps (匹配 final_comprehensive 格式：skill_gaps_identified)
                        const skillGaps = lm.skill_gaps_identified || lm.skillgapsidentified || lm.skillGapsIdentified;
                        if (Array.isArray(skillGaps) && skillGaps.length > 0) {
                            const skillsContent = skillGaps
                                .map((s) => `• ${s}`)
                                .join('\n');
                            this.addSectionToFrame(frame, '📈 Skill Gaps Identified', skillsContent);
                        }
                        // 3. Module-specific guidance (匹配 final_comprehensive 格式：module_specific_guidance)
                        const moduleGuidance = lm.module_specific_guidance || lm.modulespecificguidance || lm.moduleSpecificGuidance;
                        if (moduleGuidance) {
                            const mg = Array.isArray(moduleGuidance)
                                ? moduleGuidance.map((s) => `• ${s}`).join('\n')
                                : moduleGuidance;
                            this.addSectionToFrame(frame, '🧭 Module-Specific Guidance', mg);
                        }
                        // 4. Suggested next learning (匹配 final_comprehensive 格式：suggested_next_learning)
                        const nextLearning = lm.suggested_next_learning || lm.suggestednextlearning || lm.suggestedNextLearning;
                        if (Array.isArray(nextLearning) && nextLearning.length > 0) {
                            const nextContent = nextLearning
                                .map((s) => `• ${s}`)
                                .join('\n');
                            this.addSectionToFrame(frame, '📖 Suggested Next Learning', nextContent);
                        }
                    }
                }
                else {
                    // ========== 旧数据结构处理（保持兼容） ==========
                    // 📊 Summary
                    if (finalData.summary) {
                        this.addSectionToFrame(frame, '📊 Summary', finalData.summary);
                    }
                    // 🎯 Key Decisions
                    if (finalData.decisions && finalData.decisions.length > 0) {
                        finalData.decisions.forEach((d, i) => {
                            this.addSectionToFrame(frame, `🎯 Decision ${i + 1}`, d);
                        });
                    }
                    // 💡 Explicit Knowledge
                    if (finalData.explicit && finalData.explicit.length > 0) {
                        finalData.explicit.forEach((e, i) => {
                            this.addSectionToFrame(frame, `💡 Explicit Knowledge ${i + 1}`, e);
                        });
                    }
                    // 🧠 Tacit Knowledge
                    if (finalData.tacit && finalData.tacit.length > 0) {
                        finalData.tacit.forEach((t, i) => {
                            this.addSectionToFrame(frame, `🧠 Tacit Knowledge ${i + 1}`, t);
                        });
                    }
                    // 🤔 Reasoning
                    if (finalData.reasoning) {
                        this.addSectionToFrame(frame, '🤔 Strategic Reasoning', finalData.reasoning);
                    }
                    // 🚀 Suggestions
                    if (finalData.suggestions && finalData.suggestions.length > 0) {
                        finalData.suggestions.forEach((s, i) => {
                            this.addSectionToFrame(frame, `🚀 Suggestion ${i + 1}`, s);
                        });
                    }
                }
                // 将框架添加到画布并居中显示
                figma.currentPage.appendChild(frame);
                figma.viewport.scrollAndZoomIntoView([frame]);
                console.log('✅ Final summary canvas created with formatted layout');
            }
            catch (error) {
                console.error('❌ Error creating final summary with data:', error);
                throw error;
            }
        });
    }
    // async createFinalSummaryWithData(finalData: any): Promise<void> {
    //   try {
    //     await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    //     await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    //     await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    //     const date = new Date().toLocaleDateString();
    //     const frame = figma.createFrame();
    // frame.name = `Meeting Summary - ${date}`;
    // frame.resize(1000, 1400);  // 更宽一些
    // frame.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.99 } }];  // 浅灰背景
    // frame.cornerRadius = 16;  // 圆角更大
    // frame.layoutMode = 'VERTICAL';
    // frame.paddingLeft = 40;
    // frame.paddingRight = 40;
    // frame.paddingTop = 40;
    // frame.paddingBottom = 40;
    // frame.itemSpacing = 24;  // 增加间距
    // frame.primaryAxisSizingMode = 'AUTO';  // 自动高度
    //     // const frame = figma.createFrame();
    //     // frame.name = `Meeting Summary - ${date}`;
    //     // frame.resize(900, 1200);
    //     // frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    //     frame.strokeWeight = 2;
    //     frame.strokes = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
    //     frame.cornerRadius = 8;
    //     frame.layoutMode = 'VERTICAL';
    //     frame.paddingLeft = 32;
    //     frame.paddingRight = 32;
    //     frame.paddingTop = 32;
    //     frame.paddingBottom = 32;
    //     frame.itemSpacing = 20;
    //     // 标题
    //     // const title = figma.createText();
    //     // title.fontName = { family: 'Inter', style: 'Bold' };
    //     // title.fontSize = 24;
    //     // title.characters = '📋 Meeting Summary';
    //     // 创建标题容器
    // const headerFrame = figma.createFrame();
    // headerFrame.layoutMode = 'HORIZONTAL';
    // headerFrame.counterAxisSizingMode = 'AUTO';
    // headerFrame.primaryAxisSizingMode = 'AUTO';
    // headerFrame.fills = [];  // 透明背景
    // headerFrame.itemSpacing = 16;
    // const title = figma.createText();
    // title.fontName = { family: 'Inter', style: 'Bold' };
    // title.fontSize = 32;  // 更大的标题
    // title.characters = '📋 Meeting Summary';
    // title.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.2 } }];
    // // 添加日期
    // const dateText = figma.createText();
    // dateText.fontName = { family: 'Inter', style: 'Regular' };
    // dateText.fontSize = 14;
    // dateText.characters = date;
    // dateText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.6 } }];
    // headerFrame.appendChild(title);
    // frame.appendChild(headerFrame);
    // frame.appendChild(dateText);
    //     title.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
    //     frame.appendChild(title);
    //     // 📊 Summary
    //     if (finalData.summary) {
    //       this.addSectionToFrame(frame, '📊 Summary', finalData.summary);
    //     }
    //     // 🎯 Key Decisions
    //     // if (finalData.decisions && finalData.decisions.length > 0) {
    //     //   const decisionsContent = finalData.decisions
    //     //     .map((d: string, i: number) => `${i + 1}. ${d}`)
    //     //     .join('\n\n');
    //     //   this.addSectionToFrame(frame, '🎯 Key Decisions', decisionsContent);
    //     // }
    //     if (finalData.decisions && finalData.decisions.length > 0) {
    //   const decisionsContent = finalData.decisions
    //     .map((d: string, i: number) => `${i + 1}. ${d}`)
    //     .join('\n\n');  // 双换行增加间距
    //   this.addSectionToFrame(frame, '🎯 Key Decisions', decisionsContent);
    // }
    //     // 💡 Explicit Knowledge
    //     if (finalData.explicit && finalData.explicit.length > 0) {
    //       const explicitContent = finalData.explicit
    //        .map((e: string, i: number) => `•  ${e}`)  // 添加空格
    //     .join('\n\n');  // 双换行
    //       this.addSectionToFrame(frame, '💡 Explicit Knowledge', explicitContent);
    //     }
    //     // 🧠 Tacit Knowledge
    //     if (finalData.tacit && finalData.tacit.length > 0) {
    //       const tacitContent = finalData.tacit
    //         .map((t: string, i: number) => `•  ${t}`)  // 添加空格
    //     .join('\n\n');  // 双换行
    //       this.addSectionToFrame(frame, '🧠 Tacit Knowledge', tacitContent);
    //     }
    //     // 🤔 Reasoning
    //     if (finalData.reasoning) {
    //       this.addSectionToFrame(frame, '🤔 Strategic Reasoning', finalData.reasoning);
    //     }
    //     // 💬 Suggestions
    //     if (finalData.suggestions && finalData.suggestions.length > 0) {
    //       const suggestionsContent = finalData.suggestions
    //         .map((s: string, i: number) => `• ${s}`)
    //         .join('\n');
    //       this.addSectionToFrame(frame, '💬 Suggestions', suggestionsContent);
    //     }
    //     // 居中显示
    //     const bounds = figma.viewport.bounds;
    //     frame.x = bounds.x + (bounds.width - frame.width) / 2;
    //     frame.y = bounds.y + 100;
    //     figma.currentPage.appendChild(frame);
    //     figma.currentPage.selection = [frame];
    //     figma.viewport.scrollAndZoomIntoView([frame]);
    //     console.log('✅ Final summary canvas created with Supabase data');
    //   } catch (error) {
    //     console.error('❌ Error creating final summary:', error);
    //     throw error;
    //   }
    // }
    // 辅助方法：清理 markdown 符号
    cleanMarkdownSymbols(text) {
        if (!text)
            return '';
        return text
            // 移除粗体符号 **text** 或 __text__
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/__(.+?)__/g, '$1')
            // 移除斜体符号 *text* 或 _text_
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/_(.+?)_/g, '$1')
            // 移除标题符号 ###
            .replace(/^#{1,6}\s+/gm, '')
            // 移除删除线 ~~text~~
            .replace(/~~(.+?)~~/g, '$1')
            // 移除代码块符号 ```
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`(.+?)`/g, '$1')
            // 移除链接 [text](url)
            .replace(/\[(.+?)\]\(.+?\)/g, '$1')
            // 移除图片 ![alt](url)
            .replace(/!\[.*?\]\(.+?\)/g, '')
            // 移除多余空白
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
    addSectionToFrame(parent, title, content) {
        // 创建 section 卡片
        const sectionCard = figma.createFrame();
        sectionCard.layoutMode = 'VERTICAL';
        sectionCard.counterAxisSizingMode = 'AUTO';
        sectionCard.primaryAxisSizingMode = 'AUTO';
        sectionCard.layoutAlign = 'STRETCH';
        sectionCard.paddingLeft = 24;
        sectionCard.paddingRight = 24;
        sectionCard.paddingTop = 20;
        sectionCard.paddingBottom = 20;
        sectionCard.cornerRadius = 12;
        sectionCard.itemSpacing = 12;
        // 根据标题类型设置背景色
        if (title.includes('Summary')) {
            sectionCard.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.97, b: 1 } }]; // 淡蓝
        }
        else if (title.includes('Decisions')) {
            sectionCard.fills = [{ type: 'SOLID', color: { r: 1, g: 0.95, b: 0.95 } }]; // 淡红
        }
        else if (title.includes('Explicit')) {
            sectionCard.fills = [{ type: 'SOLID', color: { r: 0.93, g: 0.95, b: 1 } }]; // 蓝色调
        }
        else if (title.includes('Tacit')) {
            sectionCard.fills = [{ type: 'SOLID', color: { r: 1, g: 0.97, b: 0.93 } }]; // 橘色调
        }
        else {
            sectionCard.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; // 白色
        }
        // 添加边框
        sectionCard.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.92 } }];
        sectionCard.strokeWeight = 1;
        // Section 标题
        const titleText = figma.createText();
        titleText.fontName = { family: 'Inter', style: 'Bold' };
        titleText.fontSize = 18; // 增大标题
        titleText.characters = title;
        // 标题颜色（使用之前的颜色逻辑）
        if (title.includes('Explicit')) {
            titleText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 0.9 } }];
        }
        else if (title.includes('Tacit')) {
            titleText.fills = [{ type: 'SOLID', color: { r: 1.0, g: 0.6, b: 0.2 } }];
        }
        else {
            titleText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.3 } }];
        }
        sectionCard.appendChild(titleText);
        // 添加分隔线
        const divider = figma.createLine();
        divider.resize(100, 0);
        divider.strokes = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.88 } }];
        divider.strokeWeight = 1;
        divider.layoutAlign = 'STRETCH';
        sectionCard.appendChild(divider);
        // Section 内容
        const contentText = figma.createText();
        contentText.fontName = { family: 'Inter', style: 'Regular' };
        contentText.fontSize = 14; // 稍大的字体
        contentText.characters = this.cleanMarkdownSymbols(content) || 'N/A';
        contentText.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.35 } }];
        contentText.layoutAlign = 'STRETCH';
        contentText.textAutoResize = 'HEIGHT';
        contentText.lineHeight = { value: 150, unit: 'PERCENT' }; // 增加行高
        sectionCard.appendChild(contentText);
        parent.appendChild(sectionCard);
    }
    // 辅助方法：添加 section 到 frame
    // private addSectionToFrame(parent: FrameNode, title: string, content: string): void {
    //   // Section 标题
    //   const titleText = figma.createText();
    //   titleText.fontName = { family: 'Inter', style: 'Bold' };
    //   titleText.fontSize = 16;
    //   titleText.characters = title;
    //   titleText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
    //   parent.appendChild(titleText);
    //   // Section 内容
    //   const contentText = figma.createText();
    //   contentText.fontName = { family: 'Inter', style: 'Regular' };
    //   contentText.fontSize = 13;
    //   contentText.characters = content || 'N/A';
    //   contentText.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }];
    //   contentText.resize(836, contentText.height);
    //   parent.appendChild(contentText);
    // }
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
