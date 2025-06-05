# AI Knowledge Card — Figma Meeting Summary Plugin

This is the implementation code for the **AI Knowledge Card** Figma plugin, designed to automatically record meetings, transcribe audio, analyze decision making behavior, and generate structured summaries inside Figma.

 **Note**: This plugin is not yet published on the Figma Community. To use it, you must download all files locally and run it on your own machine.

---

## ✨ What This Plugin Does

This plugin enables design teams to:
- Record meeting discussions via an external browser interface.
- Automatically transcribe and analyze audio using OpenAI’s Whisper and GPT models.
- Generate structured summaries and insert them into the Figma canvas as visual cards.
- Organize key discussion elements such as decisions, explicit and tacit knowledge, reasoning, and improvement suggestions.

---

##  File Overview

| File / Folder        | Purpose                                                                 |
|----------------------|-------------------------------------------------------------------------|
| `code.ts`            | Main Figma plugin logic. Creates summary cards inside Figma using the plugin message system. |
| `ui.html`            | Plugin user interface. Opens the recorder, displays summaries, and polls Supabase for updates. |
| `record.html`        | External recording interface. Handles 30s audio chunks, triggers summarization every N minutes, and allows manual stop. |
| `analyze.js`         | API endpoint that sends audio to OpenAI Whisper for transcription and then summarizes it via GPT. |
| `summarize.js`       | API endpoint that receives full transcripts and returns structured JSON summaries. |
| `save.js`            | Saves each transcript and summary to Supabase.                          |
| `get.js`             | Fetches the latest summary from Supabase for polling by UI.            |
| `stop.js`            | Sends a stop signal via Supabase to halt recording externally.         |

---

## 🚀 Getting Started (Local Setup)

1. **Install Node.js + NPM**  
   Download and install Node.js, which includes NPM:  
    https://nodejs.org/en/download/

2. **Install TypeScript globally**  
   ```bash
   npm install -g typescript
