<!-- # AI Knowledge Card — Figma Meeting Summary Plugin

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
   npm install -g typescript -->

# AI Meeting Assistant – Figma Plugin

An intelligent Figma plugin designed for Design Engineering student teams to automatically record meetings, transcribe audio with speaker identification, analyze decision-making behavior, and generate structured summaries with visual knowledge cards on the Figma canvas.

**Status**: Development version – Not yet published on Figma Community. Requires local installation and setup.

---

## ✨ Core Features

### 🎤 Intelligent Recording & Transcription
- **External Recording Interface**: Browser-based recording with 30-second audio chunking
- **Real-time Speaker Identification**: Powered by AssemblyAI's speaker diarization
- **Live Transcription**: Continuous transcription during recording with speaker labels
- **Multi-language Support**: English and Chinese transcription

### 🧠 AI-Powered Analysis
- **Dynamic Prompt System**: Context-aware analysis based on:
  - User role (Student/Academic Supervisor)
  - Academic module (DE4 ERO, IDE2 TTL, etc.)
  - Meeting type (Progress Update, Design Review, Planning Session, etc.)
  - Project week and team composition
  - Uploaded contextual materials (PDFs, documents)
- **Real-time Decision Tracking**: Continuous monitoring and extraction of decisions during meetings
- **Comprehensive Final Analysis**: Post-meeting deep analysis generating structured insights
- **Knowledge Classification**: Distinguishes explicit knowledge (documented facts) from tacit knowledge (experiential insights)

### 🎨 Canvas Visualization
- **Decision Timeline Cards**: Visual representation of key decisions on Figma canvas
- **Configurable Layout**: Customizable time intervals and card positioning
- **Interactive Elements**: Clickable cards with detailed decision context
- **Knowledge Cards**: Structured display of extracted explicit and tacit knowledge

### 📊 Educational Focus
- **Non-directive Outputs**: Suggestions rather than instructions to encourage independent thinking
- **Assessment Alignment**: Structured outputs aligned with academic evaluation criteria
- **Progress Tracking**: Week-by-week project milestone monitoring
- **Team Dynamics Insights**: Analysis of collaboration patterns and participation

---

## 🏗️ Architecture Overview

### Frontend Components
```
┌─────────────────────────────────────────┐
│ Figma Plugin UI (ui.html/ui_figma.html)│
│  ├─ Meeting Configuration Form         │
│  ├─ Recording Status Display           │
│  ├─ Real-time Decision Display         │
│  ├─ Final Summary Display              │
│  └─ Canvas Visualization Controls      │
└─────────────────────────────────────────┘
         │
         ├─ Message Passing ─→ code.ts (Main Plugin Thread)
         │                      ├─ Canvas Manager (canvas-manager.ts)
         │                      └─ Figma API Integration
         │
         └─ Opens External Window ─→ record.html
                                     └─ Recording & Chunking Logic
```

### Backend Services (Vercel API Routes)
```
┌──────────────────────────────────────────────┐
│ API Endpoints                                │
│  ├─ /api/analyze.js                         │
│  │   └─ AssemblyAI transcription + initial  │
│  │       analysis for each 30s chunk        │
│  │                                           │
│  ├─ /api/summarize.js                       │
│  │   └─ Real-time decision extraction       │
│  │       using dynamic prompts              │
│  │                                           │
│  ├─ /api/final-analyze.js                   │
│  │   └─ Comprehensive post-meeting analysis │
│  │       with full context                  │
│  │                                           │
│  ├─ /api/save.js / save_pdf.js             │
│  │   └─ Supabase data persistence          │
│  │                                           │
│  ├─ /api/get.js                             │
│  │   └─ Poll for analysis results          │
│  │                                           │
│  └─ /api/stop.js                            │
│      └─ Signal to halt recording            │
└──────────────────────────────────────────────┘
```

### Data Flow
```
Audio Input (30s chunks)
    ↓
AssemblyAI Transcription
(with speaker identification)
    ↓
Real-time Analysis (summarize.js)
→ Dynamic Prompt Generation (prompt-system.js)
→ Decision Extraction
→ Save to Supabase
→ UI Polling & Display
    ↓
Meeting End
    ↓
Final Analysis (final-analyze.js)
→ Comprehensive Summary
→ Knowledge Classification
→ Canvas Card Generation
    ↓
Visual Output on Figma Canvas
```

---

## 📁 File Structure

### Core Plugin Files
| File | Purpose |
|------|---------|
| **code.ts** | Main plugin thread logic, handles Figma API interactions and canvas manipulation |
| **ui.html** / **ui_figma.html** | Plugin user interface for configuration and display |
| **record.html** | External recording window with audio chunking and upload |
| **manifest.json** | Plugin configuration and permissions |

### API Endpoints
| File | Endpoint | Purpose |
|------|----------|---------|
| **analyze.js** | `/api/analyze` | Transcribe audio chunks via AssemblyAI |
| **summarize.js** | `/api/summarize` | Real-time decision extraction during recording |
| **final-analyze.js** | `/api/final-analyze` | Post-meeting comprehensive analysis |
| **save.js** | `/api/save` | Save transcripts and summaries to database |
| **save_pdf.js** | `/api/save_pdf` | Process and store uploaded PDF documents |
| **get.js** | `/api/get` | Retrieve latest analysis results |
| **stop.js** | `/api/stop` | Signal recording termination |
| **ingest_pdf.js** | `/api/ingest_pdf` | Extract and process PDF content |

### Utility Modules
| File | Purpose |
|------|---------|
| **prompt-system.js** | Dynamic prompt generation based on context |
| **supabase.js** | Database client configuration |
| **config.js** | Environment variables and API keys |
| **canvas-manager.ts** | Canvas visualization logic |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher) + **NPM**
- **Figma Desktop App** or **Figma in browser**
- **Vercel Account** (for API deployment)
- **Supabase Account** (for database)
- **API Keys**:
  - OpenAI API key
  - AssemblyAI API key

### 1. Clone Repository
```bash
git clone https://github.com/kl2321/FYP2025Kath.git
cd FYP2025Kath
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_key_here
ASSEMBLYAI_API_KEY=your_assemblyai_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

### 4. Build Plugin
```bash
npm run build
```
This compiles TypeScript files to JavaScript in the `dist/` folder.

### 5. Deploy API to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```
Note your deployment URL (e.g., `https://fyp-2025-kath.vercel.app`)

### 6. Update API URLs
In `record.html`, `ui.html`, and `ui_figma.html`, update the API endpoint URLs to match your Vercel deployment:
```javascript
const API_BASE = 'https://your-vercel-deployment.vercel.app';
```

### 7. Load Plugin in Figma

#### On Desktop:
1. Open Figma Desktop App
2. Go to **Plugins** → **Development** → **Import plugin from manifest**
3. Navigate to your project folder and select `manifest.json`

#### In Browser:
1. Go to **Figma** → **Plugins** → **Development** → **Import plugin from manifest**
2. Select `manifest.json` from your project folder

### 8. Run the Plugin
1. Open any Figma file
2. Right-click → **Plugins** → **AI Meeting Assistant**
3. Configure meeting settings in the form
4. Click **Start Recording** to open the recording window
5. Click **Start** in the recording window to begin

---

## 🎯 Usage Workflow

### Meeting Setup
1. **Select Role**: Student or Academic Supervisor
2. **Choose Module**: DE4 ERO, IDE2 TTL, or other course modules
3. **Select Meeting Type**: Progress Update, Design Review, Planning Session, etc.
4. **Set Project Week**: Current week number for context
5. **Configure Team**: Add team member names (max 5) for speaker identification
6. **Upload Materials** (optional): Add PDFs, documents for context-aware analysis

### During Recording
- **Real-time Transcription**: See live transcription with speaker labels
- **Decision Tracking**: Key decisions are extracted and displayed in real-time
- **Manual Stop**: Stop recording anytime or let it auto-stop
- **Canvas Updates**: Decision cards appear on canvas at configured intervals

### After Recording
- **Final Analysis**: Comprehensive summary generated automatically
- **Knowledge Cards**: Explicit and tacit knowledge visualized on canvas
- **Download Options**: Export transcripts and summaries
- **History**: Access past meeting analyses

---

## 🔧 Configuration

### Dynamic Prompt System
The plugin uses a sophisticated prompt generation system (`prompt-system.js`) that adapts analysis based on:
```javascript
{
  role: 'student' | 'supervisor',
  module: 'de4_ero' | 'ide2_ttl' | 'general',
  meetingType: 'progress_update' | 'design_review' | 'planning' | 'retrospective',
  projectWeek: 1-10,
  teamMembers: ['Alice', 'Bob', 'Charlie'],
  hasMaterials: boolean
}
```

### Canvas Visualization Settings
Configure in `canvas-manager.ts`:
```typescript
{
  timeInterval: 300, // seconds between decision cards
  cardWidth: 400,
  cardHeight: 200,
  startX: 100,
  startY: 100,
  layout: 'timeline' | 'grid'
}
```

---

## 🗄️ Database Schema (Supabase)

### `meetings` Table
```sql
- id: UUID (primary key)
- meeting_id: TEXT (unique identifier)
- role: TEXT
- module: TEXT
- meeting_type: TEXT
- project_week: INTEGER
- team_members: JSONB
- created_at: TIMESTAMP
```

### `transcripts` Table
```sql
- id: UUID (primary key)
- meeting_id: TEXT (foreign key)
- chunk_number: INTEGER
- speaker_label: TEXT
- text: TEXT
- timestamp: TIMESTAMP
```

### `summaries` Table
```sql
- id: UUID (primary key)
- meeting_id: TEXT (foreign key)
- summary_type: TEXT ('realtime' | 'final')
- content: JSONB
- created_at: TIMESTAMP
```

### `materials` Table
```sql
- id: UUID (primary key)
- meeting_id: TEXT (foreign key)
- file_name: TEXT
- file_type: TEXT
- content: TEXT
- uploaded_at: TIMESTAMP
```

---

## 🔐 Security & Privacy

### Data Protection
- **Local Processing**: Audio chunks processed in 30-second intervals
- **Minimal Storage**: Only transcripts and summaries stored, no raw audio
- **User Control**: Full data export and deletion capabilities
- **Encryption**: All data encrypted in transit (HTTPS) and at rest

### Privacy Compliance
- **GDPR Compatible**: User consent and data control mechanisms
- **Educational Use**: Designed for academic contexts with appropriate safeguards
- **Transparency**: Clear disclosure of AI processing and data usage
- **No Commercial Use**: Data never used for training or commercial purposes

### Figma Plugin Compliance
- **Sandbox Restrictions**: Operates within Figma's security model
- **Minimal Permissions**: Only requests necessary plugin permissions
- **External Processing**: Audio processing via secure external window
- **No Plugin Storage**: Sensitive data stored in user-controlled database

---

## 🧪 Development

### Build Commands
```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck

# Lint code
npm run lint
```

### Testing
```bash
# Test API endpoints locally
npm run test:api

# Test plugin in Figma
# Use Figma's developer console (Plugins → Development → Open Console)
```

### Debugging
1. **Plugin Console**: Right-click plugin → **Developer** → **Open Console**
2. **Network Debugging**: Use browser DevTools in recording window
3. **API Logs**: Check Vercel function logs in dashboard
4. **Database Queries**: Use Supabase Table Editor and SQL editor

---

## 📚 Key Technologies

- **Figma Plugin API**: Canvas manipulation and UI integration
- **TypeScript**: Type-safe plugin development
- **AssemblyAI**: Real-time transcription and speaker identification
- **OpenAI GPT-4**: Context-aware analysis and summarization
- **Vercel**: Serverless API hosting
- **Supabase**: PostgreSQL database with real-time capabilities
- **Web Audio API**: Browser-based audio recording

---

## 🚧 Known Limitations

- **Browser Microphone Access**: Recording must occur in external window due to Figma sandbox
- **Processing Time**: Large meetings (>60 minutes) may take 1-2 minutes for final analysis
- **Speaker Accuracy**: Identification accuracy depends on audio quality and speaker distinctiveness
- **Language Support**: Currently optimized for English and Chinese
- **File Size**: Uploaded materials limited to 10MB per file

---

## 🔮 Roadmap

### Near-term (v1.1)
- [ ] Improved speaker identification training
- [ ] Support for more file formats (DOCX, images)
- [ ] Enhanced canvas layout options
- [ ] Meeting templates for common scenarios

### Mid-term (v1.5)
- [ ] Cross-meeting trend analysis
- [ ] Team collaboration metrics
- [ ] Mobile companion app
- [ ] Integration with calendar systems

### Long-term (v2.0)
- [ ] Multi-language UI support
- [ ] Advanced visualization options
- [ ] Plugin marketplace publication
- [ ] Enterprise team features

---

## 🤝 Contributing

This is an academic research project. Contributions are welcome through:
1. **Issue Reports**: Found a bug? Open an issue with details
2. **Feature Requests**: Suggest improvements via GitHub issues
3. **Pull Requests**: Submit PRs with clear descriptions and tests
4. **Documentation**: Help improve setup guides and tutorials

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👤 Author

**Katherine Luo**  
Final Year Project 2025  
Design Engineering Programme  
Imperial College London

---

## 📞 Support

- **GitHub Issues**: https://github.com/kl2321/FYP2025Kath/issues
- **Documentation**: Check `/docs` folder for detailed guides
- **Email**: [sluo20021124@outlook.com]

---

## 🙏 Acknowledgments

- Anthropic Claude for development assistance
- AssemblyAI for transcription services
- OpenAI for analysis capabilities
- Imperial College Design Engineering Department
- Figma Developer Community

---

**Last Updated**: November 2025  
**Version**: 1.0.0-beta  
**Status**: Active Development
