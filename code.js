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
figma.showUI(__html__, { width: 480, height: 700 });
let yOffset = 0; // 🧭 To stack summary cards downward
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (yOffset === 0) {
        const { y: viewY } = figma.viewport.bounds;
        yOffset = viewY + 40;
    }
    console.log("📨 Figma received pluginMessage:", msg);
    if (msg.type === 'test') {
        figma.notify("✅ Test message received from UI!");
    }
    if (msg.type === 'analyze-transcript') {
        try {
            yield figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
            // 🧱 Create a frame as the "card"
            const frame = figma.createFrame();
            frame.resizeWithoutConstraints(500, 0);
            frame.primaryAxisSizingMode = 'AUTO'; // ⬅️ 自动高度
            frame.counterAxisSizingMode = 'FIXED'; // ⬅️ 固定宽度
            frame.fills = [{ type: 'SOLID', color: { r: 0.97, g: 0.97, b: 0.97 } }];
            frame.paddingTop = 16;
            frame.paddingBottom = 16;
            frame.paddingLeft = 16;
            frame.paddingRight = 16;
            frame.itemSpacing = 8;
            frame.layoutMode = 'VERTICAL';
            frame.counterAxisAlignItems = 'MIN';
            const { x: viewX, width: viewWidth } = figma.viewport.bounds;
            frame.x = viewX + (viewWidth / 2) - 250; // 卡片宽度约 250，居中显示
            frame.y = yOffset;
            frame.name = "Summary Card";
            // 📄 Add summary
            const summaryText = figma.createText();
            summaryText.characters = `🧠 Summary:\n${msg.summary}`;
            summaryText.fontSize = 14;
            summaryText.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
            summaryText.textAutoResize = "HEIGHT"; // ⬅️ 自动调整高度
            summaryText.resize(468, summaryText.height); // ⬅️ 固定最大宽度（-左右padding）
            yield figma.loadFontAsync(summaryText.fontName);
            frame.appendChild(summaryText);
            // 📄 Add transcript
            // const transcriptText = figma.createText();
            // transcriptText.characters = `📝 Transcript:\n${msg.transcript}`;
            // transcriptText.fontSize = 12;
            // transcriptText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
            // await figma.loadFontAsync(transcriptText.fontName as FontName);
            // frame.appendChild(transcriptText);
            figma.currentPage.appendChild(frame);
            figma.viewport.scrollAndZoomIntoView([frame]);
            // ⬇️ Move y for next card
            figma.currentPage.appendChild(frame);
            figma.viewport.scrollAndZoomIntoView([frame]);
            yOffset = frame.y + frame.height + 24;
            //yOffset += frame.height + 24;
        }
        catch (err) {
            console.error('❌ Font load error:', err);
            figma.notify('Font loading failed!');
        }
    }
});
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
