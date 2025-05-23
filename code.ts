figma.showUI(__html__, { width: 480, height: 520 });

figma.ui.onmessage = async (msg) => {
  console.log("📨 Figma received pluginMessage:", msg);

  if (msg.type === 'test') {
    figma.notify("✅ Test message received from UI!");
  }

  if (msg.type === 'analyze-transcript') {
    try {
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

      const node = figma.createText();
      node.characters = `🧠 Summary:\n${msg.summary}`;
      node.fontSize = 14;
      figma.currentPage.appendChild(node);
      figma.viewport.scrollAndZoomIntoView([node]);
    } catch (err) {
      console.error('❌ Font load error:', err);
      figma.notify('Font loading failed!');
    }
  }
};




