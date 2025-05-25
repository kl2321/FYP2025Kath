figma.showUI(__html__, { width: 480, height: 520 });

figma.ui.onmessage = async (msg) => {
  console.log("📨 Figma received pluginMessage:", msg);

  if (msg.type === 'test') {
    figma.notify("✅ Test message received from UI!");
  }

  if (msg.type === 'analyze-transcript') {
    try {
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

      // 插入 summary
      const summaryNode = figma.createText();
      summaryNode.characters = `🧠 Summary:\n${msg.summary}`;
      summaryNode.fontSize = 14;
      summaryNode.x = 100;
      summaryNode.y = 100 + (Date.now() % 10000) % 300; // 防止重叠
      figma.currentPage.appendChild(summaryNode);

      // 可选：插入 transcript
      const transcriptNode = figma.createText();
      transcriptNode.characters = `📝 Transcript:\n${msg.transcript}`;
      transcriptNode.fontSize = 12;
      transcriptNode.x = 100;
      transcriptNode.y = summaryNode.y + 120;
      figma.currentPage.appendChild(transcriptNode);

      figma.viewport.scrollAndZoomIntoView([summaryNode, transcriptNode]);

    } catch (err) {
      console.error('❌ Font load error:', err);
      figma.notify('Font loading failed!');
    }
  }
};



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




