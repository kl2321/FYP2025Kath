// code.ts - Main plugin file with storage support
figma.showUI(__html__, { 
  width: 400, 
  height: 600,
  title: "AI Meeting Assistant"
});

// Storage management for plugin
const STORAGE_KEY_PREFIX = 'ai_meeting_';

// Message handling from UI
figma.ui.onmessage = async (msg) => {
  console.log('Received message:', msg);

  switch (msg.type) {
    case 'save-storage':
      // Save data to Figma's client storage
      await figma.clientStorage.setAsync(STORAGE_KEY_PREFIX + msg.key, msg.value);
      break;
    
    case 'load-storage':
      // Load data from Figma's client storage
      const value = await figma.clientStorage.getAsync(STORAGE_KEY_PREFIX + msg.key);
      figma.ui.postMessage({
        type: 'storage-loaded',
        key: msg.key,
        value: value
      });
      break;
    
    case 'file-upload':
      // Handle file upload
      await handleFileUpload(msg);
      break;
    
    case 'process-recording':
      await handleRecordingProcess(msg.formData, msg.audioData);
      break;
    
    case 'insert-summary':
      await insertSummaryToCanvas(msg.data);
      break;
    
    case 'resize':
      figma.ui.resize(msg.width, msg.height);
      break;
    
    default:
      console.log('Unknown message type:', msg.type);
  }
};

// Handle file uploads
async function handleFileUpload(msg: any) {
  // Store file data temporarily in client storage
  const fileKey = `${STORAGE_KEY_PREFIX}file_${msg.fileName}`;
  await figma.clientStorage.setAsync(fileKey, {
    fileName: msg.fileName,
    fileType: msg.fileType,
    fileContent: msg.fileContent,
    uploadedAt: Date.now()
  });
  
  console.log(`File ${msg.fileName} stored successfully`);
}

// Process recording with AI
async function handleRecordingProcess(formData: any, audioData: string) {
  try {
    // Show processing state
    figma.ui.postMessage({
      type: 'processing-start'
    });

    // In a real implementation, you would:
    // 1. Send audio to your backend API
    // 2. Process with AI (speech-to-text, speaker diarization, analysis)
    // 3. Return structured results
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock results for demonstration
    const results = {
      overview: `A ${formData.meetingType.replace('-', ' ')} session for the ${formData.module.replace('-', ' ')} module. 
                 The team discussed key aspects of the project and made important decisions regarding the next steps.`,
      decisions: [
        "Adopt a mobile-first design approach for better user experience",
        "Schedule weekly sync meetings every Monday at 2 PM",
        "Prioritize user authentication feature for the next sprint"
      ],
      actions: [
        `${formData.teamMembers[0] || 'Team Member 1'}: Create initial wireframes by end of week`,
        `${formData.teamMembers[1] || 'Team Member 2'}: Research competitor solutions`,
        `${formData.teamMembers[2] || 'Team Member 3'}: Set up development environment`
      ],
      participants: formData.teamMembers.length > 0 ? formData.teamMembers : ["Speaker 1", "Speaker 2", "Speaker 3"]
    };

    // Send results back to UI
    figma.ui.postMessage({
      type: 'processing-complete',
      results: results
    });

    // Store results in client storage for later retrieval
    await figma.clientStorage.setAsync(
      `${STORAGE_KEY_PREFIX}last_summary`,
      {
        ...results,
        timestamp: Date.now(),
        formData: formData
      }
    );

  } catch (error) {
    console.error('Processing error:', error);
    figma.ui.postMessage({
      type: 'processing-error',
      error: 'Failed to process recording. Please try again.'
    });
  }
}

// Insert summary into Figma canvas
async function insertSummaryToCanvas(data: any) {
  try {
    // Load necessary fonts
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });

    // Get the last saved summary
    const summary = await figma.clientStorage.getAsync(`${STORAGE_KEY_PREFIX}last_summary`);
    
    if (!summary) {
      figma.notify("❌ No summary available to insert");
      return;
    }

    // Create main frame
    const frame = figma.createFrame();
    frame.name = `Meeting Summary - ${new Date().toLocaleDateString()}`;
    frame.resize(800, 600);
    frame.fills = [{
      type: 'SOLID',
      color: { r: 0.98, g: 0.98, b: 0.98 }
    }];
    frame.cornerRadius = 8;

    // Add auto-layout
    frame.layoutMode = 'VERTICAL';
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'FIXED';
    frame.paddingTop = 40;
    frame.paddingRight = 40;
    frame.paddingBottom = 40;
    frame.paddingLeft = 40;
    frame.itemSpacing = 24;

    // Position in viewport
    frame.x = figma.viewport.center.x - 400;
    frame.y = figma.viewport.center.y - 300;

    // Add title
    const title = figma.createText();
    title.characters = "📝 Meeting Summary";
    title.fontSize = 28;
    title.fontName = { family: "Inter", style: "Bold" };
    frame.appendChild(title);

    // Add metadata
    const metadata = figma.createText();
    metadata.characters = `${data.module.replace('-', ' ')} | ${data.meetingType.replace('-', ' ')} | ${new Date().toLocaleDateString()}`;
    metadata.fontSize = 14;
    metadata.fontName = { family: "Inter", style: "Regular" };
    metadata.fills = [{
      type: 'SOLID',
      color: { r: 0.4, g: 0.4, b: 0.4 }
    }];
    frame.appendChild(metadata);

    // Add overview section
    if (summary.overview) {
      const overviewFrame = createSection("Overview", summary.overview);
      frame.appendChild(overviewFrame);
    }

    // Add decisions section
    if (summary.decisions && summary.decisions.length > 0) {
      const decisionsFrame = createSection(
        "🎯 Key Decisions",
        summary.decisions.map((d: string, i: number) => `${i + 1}. ${d}`).join('\n')
      );
      frame.appendChild(decisionsFrame);
    }

    // Add action items section
    if (summary.actions && summary.actions.length > 0) {
      const actionsFrame = createSection(
        "✅ Action Items",
        summary.actions.map((a: string) => `• ${a}`).join('\n')
      );
      frame.appendChild(actionsFrame);
    }

    // Select and focus on the created frame
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    // Notify success
    figma.notify("✅ Meeting summary inserted successfully!");

  } catch (error) {
    console.error('Error inserting summary:', error);
    figma.notify("❌ Failed to insert summary");
  }
}

// Helper function to create a section
function createSection(title: string, content: string): FrameNode {
  const section = figma.createFrame();
  section.layoutMode = 'VERTICAL';
  section.primaryAxisSizingMode = 'AUTO';
  section.counterAxisSizingMode = 'FIXED';
  section.layoutAlign = 'STRETCH';  // 添加这行来达到填充效果
  section.fills = [{
    type: 'SOLID',
    color: { r: 0.95, g: 0.95, b: 0.95 }
  }];
  section.cornerRadius = 6;
  section.paddingTop = 16;
  section.paddingRight = 16;
  section.paddingBottom = 16;
  section.paddingLeft = 16;
  section.itemSpacing = 8;

  const sectionTitle = figma.createText();
  sectionTitle.characters = title;
  sectionTitle.fontSize = 16;
  sectionTitle.fontName = { family: "Inter", style: "Bold" };
  section.appendChild(sectionTitle);

  const sectionContent = figma.createText();
  sectionContent.characters = content;
  sectionContent.fontSize = 14;
  sectionContent.fontName = { family: "Inter", style: "Regular" };
  sectionContent.layoutAlign = 'STRETCH';
  section.appendChild(sectionContent);

  return section;
}

// Initialize plugin
(async () => {
  // Load any saved state
  const savedState = await figma.clientStorage.getAsync(`${STORAGE_KEY_PREFIX}plugin_state`);
  if (savedState) {
    console.log('Loaded saved state:', savedState);
  }
})();

// Clean up on close
figma.on("close", async () => {
  // Save current state if needed
  await figma.clientStorage.setAsync(`${STORAGE_KEY_PREFIX}plugin_state`, {
    lastUsed: Date.now()
  });
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




