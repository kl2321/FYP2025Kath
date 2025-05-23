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
figma.showUI(__html__, { width: 480, height: 520 });
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("📨 Figma received pluginMessage:", msg);
    if (msg.type === 'test') {
        figma.notify("✅ Test message received from UI!");
    }
    if (msg.type === 'analyze-transcript') {
        try {
            yield figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
            const node = figma.createText();
            node.characters = `📝 Transcript:\n${msg.transcript}\n\n🧠 Summary:\n${msg.summary}`;
            node.fontSize = 14;
            figma.currentPage.appendChild(node);
            figma.viewport.scrollAndZoomIntoView([node]);
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
//   if (msg.type === 'analyze-transcript') {
//     try {
//       await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' });
//       const textNode = figma.createText();
//       textNode.characters = `🧠 Summary:\n${msg.summary || 'No summary found.'}`;
//       textNode.fontSize = 14;
//       figma.currentPage.appendChild(textNode);
//       figma.viewport.scrollAndZoomIntoView([textNode]);
//       figma.notify("✅ Text inserted!");
//     } catch (err) {
//       console.error('❌ Font load failed:', err);
//       figma.notify('Font load failed.');
//     }
//   }
//   // ✅ TEST MESSAGE HANDLER
//   if (msg.type === 'test-debug') {
//     figma.notify("✅ Test message received!");
//     figma.ui.postMessage({ type: 'reply', message: '🎯 Plugin received your message' });
//   }
// };
// figma.showUI(__html__, { width: 500, height: 600 });
// figma.ui.onmessage = async (msg) => {
//   if (msg.transcript && msg.summary) {
//     try {
//       await figma.loadFontAsync({ family: "Inter", style: "Regular" });
//       const textNode = figma.createText();
//       textNode.characters = `📝 Transcript:\n${msg.transcript}\n\n🧠 Summary:\n${msg.summary}`;
//       textNode.fontSize = 14;
//       textNode.x = 100;
//       textNode.y = 100;
//       figma.currentPage.appendChild(textNode);
//       figma.viewport.scrollAndZoomIntoView([textNode]);
//     } catch (err) {
//       console.error("❌ Font load failed:", err);
//       figma.notify("Font loading failed.");
//     }
//   }
// };
// figma.ui.onmessage = async (msg: { type: string; text?: string }) => {
//   if (msg.type === "analyze-transcript" && msg.text) {
//     const transcript = msg.text;
//     console.log("📥 Plugin received transcript:", transcript); // ← 新增调试行
//     if (figma.editorType === "figma") {
//   const preview = transcript.slice(0, 50);
//   figma.notify("Transcript received: " + preview + "...");
//   try {
//     // ✅ 1. 加载字体，必须在创建 textNode 前
//     await figma.loadFontAsync({ family: "Inter", style: "Regular" });
//     console.log("✅ Font loaded successfully");
//     // ✅ 2. 创建文本框
//     const textNode = figma.createText();
//     // ✅ 3. 设置文本内容
//     textNode.characters = transcript;
//     textNode.fontSize = 16;
//     textNode.x = 100;
//     textNode.y = 100;
//     // ✅ 4. 添加到画布
//     figma.currentPage.appendChild(textNode);
//     figma.viewport.scrollAndZoomIntoView([textNode]);
//   } catch (err) {
//     console.error("❌ Font load failed:", err);
//     figma.notify("⚠️ Font loading failed. Please check font name or retry.");
//   }
// }
//     if (figma.editorType === "figjam") {
//   const sticky = figma.createSticky();
//   sticky.x = 100;
//   sticky.y = 100;
//   await (sticky as any).setTextAsync(transcript);
//   figma.currentPage.appendChild(sticky);
//   console.log("🔥 Sticky text:", sticky.text);
// }
//     figma.closePlugin();
//   }
// };
