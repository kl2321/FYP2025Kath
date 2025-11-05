// canvas-manager.ts - Canvas display management module
// Handles real-time meeting cards and final summary presentation
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class CanvasManager {
    constructor() {
        this.realtimeFrame = null;
        this.cardPositions = new Map();
        this.currentRow = 0;
        this.currentCol = 0;
        // Canvas configuration
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
    // Initialize real-time canvas
    initializeRealtimeCanvas() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Load fonts
                yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
                yield figma.loadFontAsync({ family: "Inter", style: "Bold" });
                // Create main frame
                this.realtimeFrame = figma.createFrame();
                this.realtimeFrame.name = "Real-time Meeting Canvas";
                this.realtimeFrame.resize(this.CONFIG.CANVAS_WIDTH, this.CONFIG.CANVAS_HEIGHT);
                // Style the frame
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
                // Add header
                yield this.addCanvasHeader();
                // Position in viewport
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
    // Add header to canvas
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
            // Add timeline indicator
            const timeline = figma.createText();
            timeline.characters = "Duration: Every 10 mins";
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
    // Add decision card to real-time canvas
    addDecisionCard(card) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.realtimeFrame) {
                yield this.initializeRealtimeCanvas();
            }
            // Create card frame
            const cardFrame = figma.createFrame();
            cardFrame.name = `Decision ${card.minute}min`;
            cardFrame.resize(this.CONFIG.CARD_WIDTH, this.CONFIG.CARD_HEIGHT);
            // Calculate position
            const x = this.CONFIG.PADDING + (this.currentCol * (this.CONFIG.CARD_WIDTH + this.CONFIG.CARD_GAP));
            const y = 120 + (this.currentRow * (this.CONFIG.CARD_HEIGHT + this.CONFIG.CARD_GAP));
            cardFrame.x = x;
            cardFrame.y = y;
            // Style card
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
            // Add auto-layout
            cardFrame.layoutMode = 'VERTICAL';
            cardFrame.paddingTop = 12;
            cardFrame.paddingRight = 12;
            cardFrame.paddingBottom = 12;
            cardFrame.paddingLeft = 12;
            cardFrame.itemSpacing = 8;
            // Add timestamp
            const timestamp = figma.createText();
            timestamp.characters = `${card.minute} min`;
            timestamp.fontSize = 12;
            timestamp.fontName = { family: "Inter", style: "Bold" };
            timestamp.fills = [{
                    type: 'SOLID',
                    color: { r: 0.4, g: 0.4, b: 0.4 }
                }];
            // Add decision text
            const decisionText = figma.createText();
            decisionText.characters = card.decision.slice(0, 60) + (card.decision.length > 60 ? '...' : '');
            decisionText.fontSize = 13;
            decisionText.fontName = { family: "Inter", style: "Regular" };
            decisionText.layoutAlign = 'STRETCH';
            // Add owner
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
            // Update position for next card
            this.currentCol++;
            if (this.currentCol >= this.CONFIG.CARDS_PER_ROW) {
                this.currentCol = 0;
                this.currentRow++;
            }
            // Store position
            this.cardPositions.set(card.id, { x, y });
        });
    }
    // Create final summary
    createFinalSummary(summary, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Load fonts
                yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
                yield figma.loadFontAsync({ family: "Inter", style: "Bold" });
                yield figma.loadFontAsync({ family: "Inter", style: "SemiBold" });
                // Create main frame
                const summaryFrame = figma.createFrame();
                summaryFrame.name = `Meeting Summary - ${new Date().toLocaleDateString()}`;
                summaryFrame.resize(900, 1200);
                // Style
                summaryFrame.fills = [{
                        type: 'SOLID',
                        color: { r: 1, g: 1, b: 1 }
                    }];
                summaryFrame.cornerRadius = 12;
                summaryFrame.effects = [{
                        type: 'DROP_SHADOW',
                        color: { r: 0, g: 0, b: 0, a: 0.1 },
                        offset: { x: 0, y: 4 },
                        radius: 20,
                        visible: true,
                        blendMode: 'NORMAL'
                    }];
                // Auto-layout
                summaryFrame.layoutMode = 'VERTICAL';
                summaryFrame.paddingTop = 40;
                summaryFrame.paddingRight = 40;
                summaryFrame.paddingBottom = 40;
                summaryFrame.paddingLeft = 40;
                summaryFrame.itemSpacing = 32;
                // Position
                summaryFrame.x = figma.viewport.center.x - 450;
                summaryFrame.y = figma.viewport.center.y - 600;
                // Add header section
                yield this.addSummaryHeader(summaryFrame, metadata);
                // Add executive summary
                if (summary.overview) {
                    yield this.addSummarySection(summaryFrame, "Executive Summary", summary.overview, "📊");
                }
                // Add progress check
                yield this.addProgressSection(summaryFrame, summary.progress);
                // Add key decisions
                if (summary.decisions.length > 0) {
                    yield this.addDecisionsSection(summaryFrame, summary.decisions);
                }
                // Add action items
                if (summary.actions.length > 0) {
                    yield this.addActionsSection(summaryFrame, summary.actions);
                }
                figma.currentPage.appendChild(summaryFrame);
                // Focus on created frame
                figma.currentPage.selection = [summaryFrame];
                figma.viewport.scrollAndZoomIntoView([summaryFrame]);
            }
            catch (error) {
                console.error('Error creating final summary:', error);
                throw error;
            }
        });
    }
    // Add header to summary
    addSummaryHeader(parent, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            // Title
            const title = figma.createText();
            title.characters = "Meeting Summary";
            title.fontSize = 32;
            title.fontName = { family: "Inter", style: "Bold" };
            parent.appendChild(title);
            // Metadata frame
            const metaFrame = figma.createFrame();
            metaFrame.layoutMode = 'HORIZONTAL';
            metaFrame.counterAxisSizingMode = 'AUTO';
            metaFrame.primaryAxisSizingMode = 'AUTO';
            metaFrame.itemSpacing = 24;
            metaFrame.fills = [];
            // Add metadata items
            const metaItems = [
                { label: "TEAM", value: metadata.team || "Navigation Squad" },
                { label: "MODULE", value: metadata.module || "DE4 ERO" },
                { label: "WEEK", value: `Week ${metadata.week || 5}` },
                { label: "DATE", value: new Date().toLocaleDateString() },
                { label: "TYPE", value: metadata.meetingType || "Brainstorming" }
            ];
            for (const item of metaItems) {
                const itemFrame = figma.createFrame();
                itemFrame.layoutMode = 'VERTICAL';
                itemFrame.counterAxisSizingMode = 'AUTO';
                itemFrame.primaryAxisSizingMode = 'AUTO';
                itemFrame.fills = [];
                const label = figma.createText();
                label.characters = item.label;
                label.fontSize = 10;
                label.fontName = { family: "Inter", style: "Bold" };
                label.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
                const value = figma.createText();
                value.characters = item.value;
                value.fontSize = 14;
                value.fontName = { family: "Inter", style: "Regular" };
                itemFrame.appendChild(label);
                itemFrame.appendChild(value);
                metaFrame.appendChild(itemFrame);
            }
            parent.appendChild(metaFrame);
        });
    }
    // Add progress section
    addProgressSection(parent, progress) {
        return __awaiter(this, void 0, void 0, function* () {
            const section = figma.createFrame();
            section.layoutMode = 'VERTICAL';
            section.counterAxisSizingMode = 'FIXED';
            section.primaryAxisSizingMode = 'AUTO';
            section.layoutAlign = 'STRETCH';
            section.itemSpacing = 16;
            section.fills = [];
            // Title
            const title = figma.createText();
            title.characters = "📈 Project Progress Check";
            title.fontSize = 20;
            title.fontName = { family: "Inter", style: "SemiBold" };
            section.appendChild(title);
            // Progress cards container
            const cardsContainer = figma.createFrame();
            cardsContainer.layoutMode = 'HORIZONTAL';
            cardsContainer.counterAxisSizingMode = 'FIXED';
            cardsContainer.primaryAxisSizingMode = 'AUTO';
            cardsContainer.layoutAlign = 'STRETCH';
            cardsContainer.itemSpacing = 16;
            cardsContainer.fills = [];
            // Create progress cards
            const progressData = [
                { label: "On Track", items: progress.onTrack || [], color: { r: 0.2, g: 0.8, b: 0.4 } },
                { label: "Behind", items: progress.behind || [], color: { r: 0.9, g: 0.3, b: 0.3 } },
                { label: "Ahead", items: progress.ahead || [], color: { r: 1, g: 0.7, b: 0 } }
            ];
            for (const data of progressData) {
                const card = figma.createFrame();
                card.layoutMode = 'VERTICAL';
                card.layoutGrow = 1;
                card.paddingTop = 16;
                card.paddingRight = 16;
                card.paddingBottom = 16;
                card.paddingLeft = 16;
                card.itemSpacing = 8;
                card.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.98 } }];
                card.cornerRadius = 8;
                const cardTitle = figma.createText();
                cardTitle.characters = `${data.label} (${data.items.length})`;
                cardTitle.fontSize = 14;
                cardTitle.fontName = { family: "Inter", style: "SemiBold" };
                cardTitle.fills = [{ type: 'SOLID', color: data.color }];
                const cardContent = figma.createText();
                cardContent.characters = data.items.join('\n• ');
                cardContent.fontSize = 12;
                cardContent.fontName = { family: "Inter", style: "Regular" };
                cardContent.layoutAlign = 'STRETCH';
                card.appendChild(cardTitle);
                if (data.items.length > 0) {
                    card.appendChild(cardContent);
                }
                cardsContainer.appendChild(card);
            }
            section.appendChild(cardsContainer);
            parent.appendChild(section);
        });
    }
    // Add decisions section
    addDecisionsSection(parent, decisions) {
        return __awaiter(this, void 0, void 0, function* () {
            const section = figma.createFrame();
            section.layoutMode = 'VERTICAL';
            section.counterAxisSizingMode = 'FIXED';
            section.primaryAxisSizingMode = 'AUTO';
            section.layoutAlign = 'STRETCH';
            section.itemSpacing = 12;
            section.fills = [];
            const title = figma.createText();
            title.characters = "🎯 Key Decisions";
            title.fontSize = 20;
            title.fontName = { family: "Inter", style: "SemiBold" };
            section.appendChild(title);
            decisions.forEach((decision, index) => {
                const decisionFrame = figma.createFrame();
                decisionFrame.layoutMode = 'HORIZONTAL';
                decisionFrame.counterAxisSizingMode = 'AUTO';
                decisionFrame.primaryAxisSizingMode = 'AUTO';
                decisionFrame.layoutAlign = 'STRETCH';
                decisionFrame.itemSpacing = 12;
                decisionFrame.paddingTop = 12;
                decisionFrame.paddingRight = 16;
                decisionFrame.paddingBottom = 12;
                decisionFrame.paddingLeft = 16;
                decisionFrame.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.97, b: 1 } }];
                decisionFrame.cornerRadius = 6;
                const number = figma.createText();
                number.characters = `${index + 1}`;
                number.fontSize = 16;
                number.fontName = { family: "Inter", style: "Bold" };
                number.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.5, b: 1 } }];
                const text = figma.createText();
                text.characters = decision;
                text.fontSize = 14;
                text.fontName = { family: "Inter", style: "Regular" };
                text.layoutGrow = 1;
                decisionFrame.appendChild(number);
                decisionFrame.appendChild(text);
                section.appendChild(decisionFrame);
            });
            parent.appendChild(section);
        });
    }
    // Add actions section
    addActionsSection(parent, actions) {
        return __awaiter(this, void 0, void 0, function* () {
            const section = figma.createFrame();
            section.layoutMode = 'VERTICAL';
            section.counterAxisSizingMode = 'FIXED';
            section.primaryAxisSizingMode = 'AUTO';
            section.layoutAlign = 'STRETCH';
            section.itemSpacing = 12;
            section.fills = [];
            const title = figma.createText();
            title.characters = "✅ Actionable Next Steps";
            title.fontSize = 20;
            title.fontName = { family: "Inter", style: "SemiBold" };
            section.appendChild(title);
            const actionsFrame = figma.createFrame();
            actionsFrame.layoutMode = 'VERTICAL';
            actionsFrame.counterAxisSizingMode = 'FIXED';
            actionsFrame.primaryAxisSizingMode = 'AUTO';
            actionsFrame.layoutAlign = 'STRETCH';
            actionsFrame.itemSpacing = 8;
            actionsFrame.paddingTop = 16;
            actionsFrame.paddingRight = 16;
            actionsFrame.paddingBottom = 16;
            actionsFrame.paddingLeft = 16;
            actionsFrame.fills = [{ type: 'SOLID', color: { r: 0.98, g: 1, b: 0.98 } }];
            actionsFrame.cornerRadius = 6;
            actions.forEach(action => {
                const actionText = figma.createText();
                actionText.characters = `• ${action}`;
                actionText.fontSize = 14;
                actionText.fontName = { family: "Inter", style: "Regular" };
                actionText.layoutAlign = 'STRETCH';
                actionsFrame.appendChild(actionText);
            });
            section.appendChild(actionsFrame);
            parent.appendChild(section);
        });
    }
    // Helper to add generic section
    addSummarySection(parent_1, title_1, content_1) {
        return __awaiter(this, arguments, void 0, function* (parent, title, content, icon = "") {
            const section = figma.createFrame();
            section.layoutMode = 'VERTICAL';
            section.counterAxisSizingMode = 'FIXED';
            section.primaryAxisSizingMode = 'AUTO';
            section.layoutAlign = 'STRETCH';
            section.itemSpacing = 12;
            section.fills = [];
            const sectionTitle = figma.createText();
            sectionTitle.characters = `${icon} ${title}`;
            sectionTitle.fontSize = 20;
            sectionTitle.fontName = { family: "Inter", style: "SemiBold" };
            const sectionContent = figma.createText();
            sectionContent.characters = content;
            sectionContent.fontSize = 14;
            sectionContent.fontName = { family: "Inter", style: "Regular" };
            sectionContent.layoutAlign = 'STRETCH';
            sectionContent.lineHeight = { value: 150, unit: 'PERCENT' };
            section.appendChild(sectionTitle);
            section.appendChild(sectionContent);
            parent.appendChild(section);
        });
    }
    // Clear canvas
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
// Export singleton instance
export const canvasManager = new CanvasManager();
