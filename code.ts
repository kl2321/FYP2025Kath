figma.showUI(__html__, { width: 500, height: 400 });

figma.ui.onmessage = async (msg: { type: string; text?: string }) => {
  if (msg.type === "analyze-transcript" && msg.text) {
    const transcript = msg.text;
    console.log("📥 Plugin received transcript:", transcript); // ← 新增调试行

    if (figma.editorType === "figma") {
  const preview = transcript.slice(0, 50);
  figma.notify("Transcript received: " + preview + "...");

  try {
    // ✅ 1. 加载字体，必须在创建 textNode 前
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    console.log("✅ Font loaded successfully");

    // ✅ 2. 创建文本框
    const textNode = figma.createText();

    // ✅ 3. 设置文本内容
    textNode.characters = transcript;
    textNode.fontSize = 16;
    textNode.x = 100;
    textNode.y = 100;

    // ✅ 4. 添加到画布
    figma.currentPage.appendChild(textNode);
    figma.viewport.scrollAndZoomIntoView([textNode]);
  } catch (err) {
    console.error("❌ Font load failed:", err);
    figma.notify("⚠️ Font loading failed. Please check font name or retry.");
  }
}



    if (figma.editorType === "figjam") {
  const sticky = figma.createSticky();
  sticky.x = 100;
  sticky.y = 100;

  await (sticky as any).setTextAsync(transcript);
  figma.currentPage.appendChild(sticky);

  console.log("🔥 Sticky text:", sticky.text);
}

    figma.closePlugin();
  }
};

