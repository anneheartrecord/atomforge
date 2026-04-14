[中文](./README.md)

# AtomForge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Live Demo](https://img.shields.io/badge/Demo-atomforge.charles--cheng.com-blue)](https://atomforge.charles-cheng.com)

**AI Agent-powered code generation platform.** Describe your idea, and a team of AI Agents collaborates to turn it into runnable code.

> 🔗 **Live Demo**: [atomforge.charles-cheng.com](https://atomforge.charles-cheng.com)
> 📖 **Docs**: [atomforge.charles-cheng.com/docs](https://atomforge.charles-cheng.com/docs)
> 💻 **Source**: [github.com/anneheartrecord/atomforge](https://github.com/anneheartrecord/atomforge)

## Design Philosophy

Based on deep usage of [Atoms.dev](https://atoms.dev), the core of an AI Agent code generation platform lies in:

1. **Foundation**: Login, code generation, live preview, download, GitHub push
2. **Agent capabilities**: Multi-turn context, user memory, Team Mode (multi-agent pipeline), Race Mode (parallel comparison)
3. **Interaction design**: Following Atoms' key decision — hiding model selection, fixing Team members, lowering the entry barrier

Uses Gemini as LLM — coding ability not consistently stable, but supports browser-direct calls (CORS), perfectly fitting the pure frontend architecture.

For rapid deployment, the codebase is almost entirely frontend TS. Backend persistence via Supabase, deployed on Vercel.

## Features

### Agent Core
- 🤖 **Engineer Mode** — Direct chat with Alex (Engineer Agent), streaming code generation, multi-turn context
- 👥 **Team Mode** — Emma(PM) → Bob(Architect) → Alex(Engineer) → Luna(QA) → Sarah(SEO) serial pipeline
- 🏁 **Race Mode** — Same prompt generates 3 parallel variants, compare and pick best
- 🧠 **Memory System** — Auto-extracts user preferences and project context, injects into next conversation

### Artifact Management
- 👁️ **Live Preview** — iframe sandbox instant rendering, Desktop/Mobile toggle
- 📝 **Monaco Editor** — VS Code-grade editing, multi-file tabs, syntax highlighting
- 📁 **File Tree** — Collapsible, create/delete files
- ⬇️ **Download** — One-click HTML export
- 🔀 **GitHub Push** — Input Token + Repo name, one-click push

### Platform
- 🔐 **Auth** — Google OAuth + Email signup/login + Demo mode
- 💾 **Persistence** — Conversations, projects, artifacts all in Supabase (5 tables + RLS)
- 📖 **Docs** — Built-in /docs page, bilingual (CN/EN)
- 🎨 **White Theme** — Clean UI with animal agent avatars

## Quick Start

```bash
git clone https://github.com/anneheartrecord/atomforge
cd atomforge
npm install
cp .env.example .env.local  # Fill in API keys
npm run dev                  # http://localhost:5173
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_GEMINI_API_KEY` | Google Gemini API key |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| AI | Google Gemini 2.5 Flash (streaming, multi-turn) |
| Auth | Supabase Auth (Google OAuth + Email) |
| Database | Supabase PostgreSQL (RLS row-level security) |
| Editor | Monaco Editor |
| Preview | iframe srcdoc sandbox |
| Deploy | Vercel + atomforge.charles-cheng.com |

## Project Structure

```
src/
├── agents/        # Agent orchestration (prompts, teamOrchestrator, raceRunner)
├── components/    # UI components (workspace, dashboard, landing, team, race)
├── hooks/         # Custom hooks (useChat, useAuth, useProject)
├── pages/         # Pages (Landing, Login, Dashboard, Workspace, Docs)
├── services/      # External services (gemini, supabase, github)
├── store/         # Zustand global state
└── types/         # TypeScript type definitions
```

## Documentation

- [Implementation Notes (EN)](./docs/DESIGN_NOTES_EN.md) — Approach, trade-offs, status, future
- [实现说明（中文）](./docs/DESIGN_NOTES.md)
- [Technical Docs (EN)](./docs/TECHNICAL_EN.md) — Architecture, API, deployment
- [技术文档（中文）](./docs/TECHNICAL.md)
- [Online Docs](https://atomforge.charles-cheng.com/docs) — Bilingual (CN/EN)

## Future Directions

- **Version snapshots + rollback**: Auto-save on each generation
- **Multi-model + smart matching**: Auto task decomposition — complex tasks use SOTA, simple tasks use fast models
- **"Easy to start, deep to master"**: Keep minimal entry experience while supporting custom Teams, model selection, Agent SDK

## License

[MIT](./LICENSE)
