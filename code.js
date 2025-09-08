"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// code.ts - Main plugin file
figma.showUI(__html__, {
    width: 400,
    height: 600,
    title: "AI Meeting Assistant"
});
// Message handling from UI
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Received message:', msg);
    switch (msg.type) {
        case 'process-recording':
            yield handleRecordingProcess(msg.formData);
            break;
        case 'insert-summary':
            yield insertSummaryToCanvas(msg.data, msg.summary);
            break;
        case 'resize':
            figma.ui.resize(msg.width, msg.height);
            break;
        default:
            console.log('Unknown message type:', msg.type);
    }
});
// Process recording with AI
function handleRecordingProcess(formData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Show processing state
            figma.ui.postMessage({
                type: 'processing-start'
            });
            // Here you would integrate with your AI service
            // For now, simulating the process
            // Simulate API call delay
            yield new Promise(resolve => setTimeout(resolve, 2000));
            // Mock results (replace with actual AI processing)
            const results = {
                overview: `${formData.meetingType} meeting for ${formData.module} module`,
                decisions: [
                    "Key decision 1 based on meeting discussion",
                    "Key decision 2 from the analysis"
                ],
                actions: [
                    "Action item 1 assigned to team member",
                    "Action item 2 with deadline"
                ],
                participants: formData.teamMembers || ["Unknown Speaker 1", "Unknown Speaker 2"]
            };
            // Send results back to UI
            figma.ui.postMessage({
                type: 'processing-complete',
                results: results
            });
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
// Insert summary into Figma canvas
function insertSummaryToCanvas(data, summary) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Load font
            yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
            yield figma.loadFontAsync({ family: "Inter", style: "Bold" });
            // Create frame for summary
            const frame = figma.createFrame();
            frame.name = "Meeting Summary - " + new Date().toLocaleDateString();
            frame.resize(800, 600);
            frame.fills = [{
                    type: 'SOLID',
                    color: { r: 0.98, g: 0.98, b: 0.98 }
                }];
            frame.cornerRadius = 8;
            frame.effects = [{
                    type: 'DROP_SHADOW',
                    color: { r: 0, g: 0, b: 0, a: 0.1 },
                    offset: { x: 0, y: 2 },
                    radius: 10,
                    visible: true,
                    blendMode: 'NORMAL'
                }];
            // Position in viewport
            frame.x = figma.viewport.center.x - 400;
            frame.y = figma.viewport.center.y - 300;
            // Add title
            const title = figma.createText();
            title.characters = "📝 Meeting Summary";
            title.fontSize = 24;
            title.fontName = { family: "Inter", style: "Bold" };
            title.x = 40;
            title.y = 40;
            frame.appendChild(title);
            // Add metadata
            const metadata = figma.createText();
            metadata.characters = `Module: ${data.module} | Type: ${data.meetingType} | Date: ${new Date().toLocaleDateString()}`;
            metadata.fontSize = 14;
            metadata.fontName = { family: "Inter", style: "Regular" };
            metadata.fills = [{
                    type: 'SOLID',
                    color: { r: 0.4, g: 0.4, b: 0.4 }
                }];
            metadata.x = 40;
            metadata.y = 80;
            frame.appendChild(metadata);
            // Add sections
            let yPosition = 140;
            // Overview section
            if (summary.overview) {
                const overviewTitle = figma.createText();
                overviewTitle.characters = "Overview";
                overviewTitle.fontSize = 18;
                overviewTitle.fontName = { family: "Inter", style: "Bold" };
                overviewTitle.x = 40;
                overviewTitle.y = yPosition;
                frame.appendChild(overviewTitle);
                const overviewText = figma.createText();
                overviewText.characters = summary.overview;
                overviewText.fontSize = 14;
                overviewText.fontName = { family: "Inter", style: "Regular" };
                overviewText.x = 40;
                overviewText.y = yPosition + 30;
                overviewText.resize(720, 100);
                frame.appendChild(overviewText);
                yPosition += 150;
            }
            // Decisions section
            if (summary.decisions && summary.decisions.length > 0) {
                const decisionsTitle = figma.createText();
                decisionsTitle.characters = "🎯 Key Decisions";
                decisionsTitle.fontSize = 18;
                decisionsTitle.fontName = { family: "Inter", style: "Bold" };
                decisionsTitle.x = 40;
                decisionsTitle.y = yPosition;
                frame.appendChild(decisionsTitle);
                summary.decisions.forEach((decision, index) => {
                    const decisionText = figma.createText();
                    decisionText.characters = `${index + 1}. ${decision}`;
                    decisionText.fontSize = 14;
                    decisionText.fontName = { family: "Inter", style: "Regular" };
                    decisionText.x = 40;
                    decisionText.y = yPosition + 30 + (index * 25);
                    frame.appendChild(decisionText);
                });
                yPosition += 30 + (summary.decisions.length * 25) + 20;
            }
            // Action items section
            if (summary.actions && summary.actions.length > 0) {
                const actionsTitle = figma.createText();
                actionsTitle.characters = "✅ Action Items";
                actionsTitle.fontSize = 18;
                actionsTitle.fontName = { family: "Inter", style: "Bold" };
                actionsTitle.x = 40;
                actionsTitle.y = yPosition;
                frame.appendChild(actionsTitle);
                summary.actions.forEach((action, index) => {
                    const actionText = figma.createText();
                    actionText.characters = `• ${action}`;
                    actionText.fontSize = 14;
                    actionText.fontName = { family: "Inter", style: "Regular" };
                    actionText.x = 40;
                    actionText.y = yPosition + 30 + (index * 25);
                    frame.appendChild(actionText);
                });
                yPosition += 30 + (summary.actions.length * 25) + 20;
            }
            // Adjust frame height based on content
            frame.resize(800, yPosition + 40);
            // Select the created frame
            figma.currentPage.selection = [frame];
            figma.viewport.scrollAndZoomIntoView([frame]);
            // Notify user
            figma.notify("✅ Meeting summary inserted successfully!");
        }
        catch (error) {
            console.error('Error inserting summary:', error);
            figma.notify("❌ Failed to insert summary");
        }
    });
}
// Clean up on close
figma.on("close", () => {
    // Any cleanup code here
});
// // Show the UI panel with defined width and height
// figma.showUI(__html__, { width: 480, height: 700 });
// let rootY: number | null = null; // Y position of the first card batch
// let rootX: number | null = null; // X position of the first card
// const CARD_WIDTH = 480;
// const CARD_GAP_X = 24; // Horizontal gap between cards
// const CARD_GAP_Y = 40; // Vertical gap between sets of 3 cards
// let cardSetCount = 0; // Track how many sets of cards have been placed
// // Handle messages from the UI
// figma.ui.onmessage = async (msg) => {
//   console.log("📨 Figma received pluginMessage:", msg);
//   if (msg.type === 'test') {
//     figma.notify("✅ Test message received from UI!");
//   }
//   if (msg.type === 'analyze-transcript') {
//     try {
//       await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
//       // Generate initial anchor position randomly based on current viewport
//       const { x: viewX, width: viewWidth, y: viewY } = figma.viewport.bounds;
//       if (rootX === null || rootY === null) {
//         rootX = viewX + Math.random() * (viewWidth - 3 * (CARD_WIDTH + CARD_GAP_X));
//         rootY = viewY + 40;
//       } else {
//         // Offset new row by vertical spacing for each new set of 3 cards
//         rootY += CARD_GAP_Y + 240; // Estimated height of tallest card + spacing
//       }
//       // Card creation function
//       const createCard = async (title: string, content: string | string[], color: RGB, colIndex: number) => {
//         const frame = figma.createFrame();
//         frame.resizeWithoutConstraints(CARD_WIDTH, 0);
//         frame.primaryAxisSizingMode = 'AUTO';
//         frame.counterAxisSizingMode = 'FIXED';
//         frame.fills = [{ type: 'SOLID', color: color }];
//         frame.paddingTop = 16;
//         frame.paddingBottom = 16;
//         frame.paddingLeft = 16;
//         frame.paddingRight = 16;
//         frame.itemSpacing = 8;
//         frame.layoutMode = 'VERTICAL';
//         frame.counterAxisAlignItems = 'MIN';
//         // Positioning: X based on column, Y based on current card set row
//         frame.x = rootX! + colIndex * (CARD_WIDTH + CARD_GAP_X);
//         frame.y = rootY!;
//         frame.name = `${title} Card`;
//         const textNode = figma.createText();
//         textNode.characters = `${title}\n` + (Array.isArray(content) ? content.join("\n• ") : content);
//         textNode.fontSize = 14;
//         textNode.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
//         textNode.textAutoResize = "HEIGHT";
//         textNode.resize(CARD_WIDTH - 32, textNode.height); // Account for padding
//         await figma.loadFontAsync(textNode.fontName as FontName);
//         frame.appendChild(textNode);
//         figma.currentPage.appendChild(frame);
//         figma.viewport.scrollAndZoomIntoView([frame]);
//       };
//       // 🟦 1. Summary card - white
//       await createCard(" Summary:", msg.summary, { r: 0.97, g: 0.97, b: 0.97 }, 0);
//       // 🟨 2. Decision + Knowledge card - light blue
//       let combinedKnowledge = [];
//       if (msg.decision) combinedKnowledge.push("📌 Decision:", ...msg.decision);
//       if (msg.explicit) combinedKnowledge.push("💡Explicit:", ...msg.explicit);
//       if (msg.tacit) combinedKnowledge.push("💡 Tacit:", ...msg.tacit);
//       await createCard("📋 Decisions & Knowledge", combinedKnowledge, { r: 0.9, g: 0.95, b: 1 }, 1);
//       // 🟪 3. Reasoning + Suggestions card - light yellow
//       let insights = [];
//       if (msg.reasoning) insights.push("🧠 Reasoning:\n" + msg.reasoning);
//       if (msg.suggestions) insights.push("🔗 Suggestions:", ...msg.suggestions);
//       await createCard("🪄 Insights & Resources", insights, { r: 1, g: 0.98, b: 0.85 }, 2);
//       cardSetCount++;
//     } catch (err) {
//       console.error('❌ Font load error:', err);
//       figma.notify('Font loading failed!');
//     }
//   }
// };
// figma.showUI(__html__, { width: 480, height: 700 });
// let yOffset: number | null = null ; // ⬅️ 用 null 表示“未初始化”
// figma.ui.onmessage = async (msg) => {
//   if (yOffset === null) {
//     const { y: viewY } = figma.viewport.bounds;
//     yOffset = viewY + 40;
// }
//   console.log("📨 Figma received pluginMessage:", msg);
//   if (msg.type === 'test') {
//     figma.notify("✅ Test message received from UI!");
//   }
//   if (msg.type === 'analyze-transcript') {
//     try {
//       await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
//       // 🧱 Create a frame as the "card"
//       const frame = figma.createFrame();
//       frame.resizeWithoutConstraints(500, 0);
//       frame.primaryAxisSizingMode = 'AUTO'; // ⬅️ 自动高度
//       frame.counterAxisSizingMode = 'FIXED'; // ⬅️ 固定宽度
//       frame.fills = [{ type: 'SOLID', color: { r: 0.97, g: 0.97, b: 0.97 } }];
//       frame.paddingTop = 16;
//       frame.paddingBottom = 16;
//       frame.paddingLeft = 16;
//       frame.paddingRight = 16;
//       frame.itemSpacing = 8;
//       frame.layoutMode = 'VERTICAL';
//       frame.counterAxisAlignItems = 'MIN';
//       const { x: viewX, width: viewWidth } = figma.viewport.bounds;
//       frame.x = viewX + (viewWidth / 2) - 250; // 卡片宽度约 250，居中显示
//       frame.y = yOffset!;
//       frame.name = "Summary Card";
//       // 📄 Add summary
//       const summaryText = figma.createText();
//       summaryText.characters = `🧠 Summary:\n${msg.summary}`;
//       summaryText.fontSize = 14;
//       summaryText.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
//       summaryText.textAutoResize = "HEIGHT";  // ⬅️ 自动调整高度
//       summaryText.resize(468, summaryText.height); // ⬅️ 固定最大宽度（-左右padding）
//       await figma.loadFontAsync(summaryText.fontName as FontName);
//       frame.appendChild(summaryText);
//       // 📄 Add transcript
//       // const transcriptText = figma.createText();
//       // transcriptText.characters = `📝 Transcript:\n${msg.transcript}`;
//       // transcriptText.fontSize = 12;
//       // transcriptText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
//       // await figma.loadFontAsync(transcriptText.fontName as FontName);
//       // frame.appendChild(transcriptText);
//       figma.currentPage.appendChild(frame);
//       figma.viewport.scrollAndZoomIntoView([frame]);
//       // ⬇️ Move y for next card
//       figma.currentPage.appendChild(frame);
//       figma.viewport.scrollAndZoomIntoView([frame]);
//       yOffset = yOffset! + frame.height + 24;
//       //yOffset += frame.height + 24;
//     } catch (err) {
//       console.error('❌ Font load error:', err);
//       figma.notify('Font loading failed!');
//     }
//   }
// };
// figma.showUI(__html__, { width: 480, height: 520 });
// figma.ui.onmessage = async (msg) => {
//   console.log("📨 Figma received pluginMessage:", msg);
//   if (msg.type === 'test') {
//     figma.notify("✅ Test message received from UI!");
//   }
//   if (msg.type === 'analyze-transcript') {
//     try {
//       await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
//       // 插入 summary
//       const summaryNode = figma.createText();
//       summaryNode.characters = `🧠 Summary:\n${msg.summary}`;
//       summaryNode.fontSize = 14;
//       summaryNode.x = 100;
//       summaryNode.y = 100 + (Date.now() % 10000) % 300; // 防止重叠
//       figma.currentPage.appendChild(summaryNode);
//       // 可选：插入 transcript
//       const transcriptNode = figma.createText();
//       transcriptNode.characters = `📝 Transcript:\n${msg.transcript}`;
//       transcriptNode.fontSize = 12;
//       transcriptNode.x = 100;
//       transcriptNode.y = summaryNode.y + 120;
//       figma.currentPage.appendChild(transcriptNode);
//       figma.viewport.scrollAndZoomIntoView([summaryNode, transcriptNode]);
//     } catch (err) {
//       console.error('❌ Font load error:', err);
//       figma.notify('Font loading failed!');
//     }
//   }
// };
// figma.showUI(__html__, { width: 480, height: 520 });
// figma.ui.onmessage = async (msg) => {
//   console.log("📨 Figma received pluginMessage:", msg);
//   if (msg.type === 'test') {
//     figma.notify("✅ Test message received from UI!");
//   }
//   if (msg.type === 'analyze-transcript') {
//     try {
//       await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
//       const node = figma.createText();
//       node.characters = `🧠 Summary:\n${msg.summary}`;
//       node.fontSize = 14;
//       figma.currentPage.appendChild(node);
//       figma.viewport.scrollAndZoomIntoView([node]);
//     } catch (err) {
//       console.error('❌ Font load error:', err);
//       figma.notify('Font loading failed!');
//     }
//   }
// };
