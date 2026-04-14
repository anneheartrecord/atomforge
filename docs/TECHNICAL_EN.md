# AtomForge Technical Documentation

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐ │
│  │  Pages    │  │Components │  │  Hooks   │  │ Store  │ │
│  │ Landing   │  │ Workspace │  │ useChat  │  │Zustand │ │
│  │ Login     │  │ Dashboard │  │ useAuth  │  │        │ │
│  │ Dashboard │  │ Auth      │  │useProject│  │        │ │
│  │ Workspace │  │ Layout    │  │useTeam   │  │        │ │
│  │ Docs      │  │ Race/Team │  │          │  │        │ │
│  └──────────┘  └───────────┘  └──────────┘  └────────┘ │
│              ┌───────────────────────────┐               │
│              │        Services           │               │
│              │  gemini.ts · supabase.ts  │               │
│              │  github.ts               │               │
│              └────────────┬──────────────┘               │
│              ┌────────────┴──────────────┐               │
│              │         Agents            │               │
│              │  prompts.ts               │               │
│              │  teamOrchestrator.ts      │               │
│              │  raceRunner.ts            │               │
│              └───────────────────────────┘               │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
  ┌──────────────┐ ┌─────────────┐ ┌─────────────┐
  │Google Gemini │ │  Supabase   │ │  GitHub API │
  │   API        │ │ Auth + DB   │ │  Git Data   │
  └──────────────┘ └─────────────┘ └─────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 + TypeScript | UI components & type safety |
| Build | Vite 8 | Fast HMR, optimized builds |
| Styling | Tailwind CSS 4 + Inline styles | Responsive white theme |
| State | Zustand 5 | Lightweight global state |
| AI | Google Gemini API | Code generation (streaming) |
| Auth | Supabase Auth | Google OAuth + Email/Password |
| Database | Supabase PostgreSQL | Projects, conversations, artifacts, versions |
| Editor | Monaco Editor | VS Code-grade code editing |
| Preview | iframe srcdoc | Sandboxed live preview |
| Deployment | Vercel | Auto-deploy from GitHub |

## Database Schema

4 tables with Row Level Security:

**projects** — User projects
- `id` uuid PK, `user_id` FK → auth.users, `name`, `description`, `files` jsonb, `mode`, `status`

**conversations** — Chat messages per project
- `id` uuid PK, `pid` FK → projects, `role`, `content`, `metadata` jsonb

**artifacts** — Generated code files & images
- `id` uuid PK, `pid` FK → projects, `filename`, `filetype`, `content`, `url`

**versions** — Project snapshots
- `id` uuid PK, `pid` FK → projects, `version_number`, `files` jsonb

## Agent Orchestration

### Team Mode (`teamOrchestrator.ts`)
Serial pipeline: `Emma → Bob → Alex → Luna → Sarah`
- Each step calls `generateWithRole(agent.systemPrompt, contextualPrompt)`
- Output of step N becomes context for step N+1
- Real-time progress via `onStepUpdate` callback
- Pipeline aborts on error

### Race Mode (`raceRunner.ts`)
Parallel execution: `Promise.allSettled()` fires N requests simultaneously
- Each request uses `streamGenerateCode` for real-time streaming
- Results displayed in side-by-side iframe previews
- Single failure doesn't affect others

## API Reference

### Gemini Service (`services/gemini.ts`)
| Function | Streaming | Use Case |
|----------|-----------|----------|
| `generateCode(prompt, context?)` | No | One-shot generation |
| `streamGenerateCode(prompt, onChunk, context?)` | Yes | Engineer mode chat |
| `generateWithRole(systemPrompt, userPrompt, onChunk?)` | Optional | Team mode agents |

### Supabase Service (`services/supabase.ts`)
| Function | Table | Description |
|----------|-------|-------------|
| `getProjects(userId)` | projects | List user's projects |
| `createProject(data)` | projects | Create new project |
| `getConversations(pid)` | conversations | Load chat history |
| `addConversation(data)` | conversations | Save message |
| `saveArtifact(pid, filename, content, type)` | artifacts | Store generated file |

## Local Development

```bash
git clone https://github.com/anneheartrecord/atomforge
cd atomforge
npm install
cp .env.example .env.local   # Fill in API keys
npm run dev                   # http://localhost:5173
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase public anon key |
| `VITE_GEMINI_API_KEY` | Yes | Google Gemini API key |

## Deployment

```bash
npm run build    # Outputs to dist/
vercel --prod    # Deploy to Vercel
```

Vercel auto-deploys on every push to `main`. Environment variables configured in Vercel dashboard.
