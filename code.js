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
// Show the UI panel with defined width and height
figma.showUI(__html__, { width: 480, height: 700 });
let rootY = null; // Y position of the first card batch
let rootX = null; // X position of the first card
const CARD_WIDTH = 480;
const CARD_GAP_X = 24; // Horizontal gap between cards
const CARD_GAP_Y = 40; // Vertical gap between sets of 3 cards
let cardSetCount = 0; // Track how many sets of cards have been placed
// Handle messages from the UI
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("📨 Figma received pluginMessage:", msg);
    if (msg.type === 'test') {
        figma.notify("✅ Test message received from UI!");
    }
    if (msg.type === 'analyze-transcript') {
        try {
            yield figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
            // Generate initial anchor position randomly based on current viewport
            const { x: viewX, width: viewWidth, y: viewY } = figma.viewport.bounds;
            if (rootX === null || rootY === null) {
                rootX = viewX + Math.random() * (viewWidth - 3 * (CARD_WIDTH + CARD_GAP_X));
                rootY = viewY + 40;
            }
            else {
                // Offset new row by vertical spacing for each new set of 3 cards
                rootY += CARD_GAP_Y + 240; // Estimated height of tallest card + spacing
            }
            // Card creation function
            const createCard = (title, content, color, colIndex) => __awaiter(void 0, void 0, void 0, function* () {
                const frame = figma.createFrame();
                frame.resizeWithoutConstraints(CARD_WIDTH, 0);
                frame.primaryAxisSizingMode = 'AUTO';
                frame.counterAxisSizingMode = 'FIXED';
                frame.fills = [{ type: 'SOLID', color: color }];
                frame.paddingTop = 16;
                frame.paddingBottom = 16;
                frame.paddingLeft = 16;
                frame.paddingRight = 16;
                frame.itemSpacing = 8;
                frame.layoutMode = 'VERTICAL';
                frame.counterAxisAlignItems = 'MIN';
                // Positioning: X based on column, Y based on current card set row
                frame.x = rootX + colIndex * (CARD_WIDTH + CARD_GAP_X);
                frame.y = rootY;
                frame.name = `${title} Card`;
                const textNode = figma.createText();
                textNode.characters = `${title}\n` + (Array.isArray(content) ? content.join("\n• ") : content);
                textNode.fontSize = 14;
                textNode.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
                textNode.textAutoResize = "HEIGHT";
                textNode.resize(CARD_WIDTH - 32, textNode.height); // Account for padding
                yield figma.loadFontAsync(textNode.fontName);
                frame.appendChild(textNode);
                figma.currentPage.appendChild(frame);
                figma.viewport.scrollAndZoomIntoView([frame]);
            });
            // 🟦 1. Summary card - white
            yield createCard(" Summary:", msg.summary, { r: 0.97, g: 0.97, b: 0.97 }, 0);
            // 🟨 2. Decision + Knowledge card - light blue
            let combinedKnowledge = [];
            if (msg.decision)
                combinedKnowledge.push("📌 Decision:", ...msg.decision);
            if (msg.explicit)
                combinedKnowledge.push("💡Explicit:", ...msg.explicit);
            if (msg.tacit)
                combinedKnowledge.push("💡 Tacit:", ...msg.tacit);
            yield createCard("📋 Decisions & Knowledge", combinedKnowledge, { r: 0.9, g: 0.95, b: 1 }, 1);
            // 🟪 3. Reasoning + Suggestions card - light yellow
            let insights = [];
            if (msg.reasoning)
                insights.push("🧠 Reasoning:\n" + msg.reasoning);
            if (msg.suggestions)
                insights.push("🔗 Suggestions:", ...msg.suggestions);
            yield createCard("🪄 Insights & Resources", insights, { r: 1, g: 0.98, b: 0.85 }, 2);
            cardSetCount++;
        }
        catch (err) {
            console.error('❌ Font load error:', err);
            figma.notify('Font loading failed!');
        }
    }
});
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
