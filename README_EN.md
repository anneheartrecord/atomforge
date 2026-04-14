[中文](./README.md)

# AtomForge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Pro-4285F4?logo=google&logoColor=white)](https://ai.google.dev)

**AI Agent-powered code generation platform.** Describe what you want in natural language, and a team of specialized AI Agents collaborates to deliver production-ready frontend code.

## Features

- 🤖 **Agent Chat** — Describe requirements in natural language; AI generates runnable frontend code
- 👥 **Team Mode** — 5 AI Agents (PM → Architect → Engineer → QA → SEO Expert) work in a pipeline
- 🏁 **Race Mode** — Generate multiple solutions in parallel for the same prompt, compare and pick the best
- 👁️ **Live Preview** — Real-time rendering in a sandboxed iframe
- 🔄 **Streaming Output** — Watch code being generated in real time
- 📦 **GitHub Integration** — Push generated code to GitHub with one click
- 💾 **Version Management** — Auto-save project snapshots with version history
- 🔐 **Authentication** — Supabase Auth with row-level security

## Quick Start

### Prerequisites

- Node.js >= 18
- A [Supabase](https://supabase.com) project
- A [Google Gemini API Key](https://ai.google.dev)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd atomforge

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Gemini credentials

# Initialize database (run supabase-schema.sql in Supabase SQL Editor)

# Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 19 + TypeScript 6 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| State Management | Zustand 5 |
| AI Model | Google Gemini 2.5 Pro |
| Backend | Supabase (Auth + PostgreSQL) |
| Code Editor | Monaco Editor |
| Icons | Lucide React |
| Routing | React Router 7 |

## Project Structure

```
src/
├── agents/          # AI Agent orchestration (system prompts, pipeline, race)
├── components/      # UI components (organized by feature)
├── hooks/           # Custom hooks (useChat, useAuth, useProject, useTeamMode)
├── lib/             # Library initialization (Supabase client)
├── pages/           # Page components (Landing, Login, Dashboard, Workspace)
├── services/        # External service wrappers (Gemini, Supabase, GitHub)
├── store/           # Zustand global state
└── types/           # TypeScript type definitions
```

## Deployment

AtomForge is a pure frontend application. Build artifacts are static files:

```bash
npm run build
```

Deploy the `dist/` directory to Vercel, Netlify, Cloudflare Pages, or any static hosting platform. The following environment variables must be configured:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_GEMINI_API_KEY` | Google Gemini API key |

## Documentation

- [Technical Docs (EN)](./docs/TECHNICAL_EN.md) | [技术文档 (中文)](./docs/TECHNICAL.md)
- [Implementation Notes (EN)](./docs/DESIGN_NOTES_EN.md) | [实现说明 (中文)](./docs/DESIGN_NOTES.md)
- [Online Docs](https://atomforge.charles-cheng.com/docs)

## License

[MIT](./LICENSE)
