# AtomForge — Implementation Notes

## 1. Implementation Approach & Key Trade-offs

### Architecture

AtomForge is a pure frontend SPA that connects directly to Gemini API and Supabase from the browser — zero backend servers required. Users describe what they want, an AI Agent team collaborates to generate runnable code, and the result renders live in an iframe.

```
React SPA (Vite + TypeScript)
  ├── Gemini 2.5 Pro API  ← Direct browser calls (CORS supported)
  ├── Supabase            ← Auth + PostgreSQL + RLS
  └── Vercel              ← Auto-deploy
```

### Key Trade-offs

**React + Vite vs Next.js**
Chose SPA over SSR. This is a tool-type app with no SEO requirements. SPA builds to pure static files, deploys to Vercel with zero config. Next.js App Router and Server Components would be pure complexity overhead here.

**iframe srcdoc vs WebContainer**
Chose the lightweight approach. WebContainer can run full Node.js but requires a paid license, has slow cold starts, and high memory usage. AI-generated code is self-contained HTML (CSS/JS all inline), so iframe srcdoc is zero-dependency, zero-latency, and sufficient.

**Supabase vs IndexedDB**
Chose cloud persistence. IndexedDB is local-only — switch devices and data is gone. Supabase provides real cross-device cloud storage + built-in Auth (Google OAuth in a few lines) + RLS row-level security.

**Gemini vs Claude/GPT**
Gemini supports direct browser calls (CORS), no backend proxy needed. This keeps the entire architecture purely "zero backend".

**Team Mode: Serial vs Parallel**
Chose serial. The pipeline's essence is progressive context refinement — the architect needs the PRD, the engineer needs the architecture. Parallel execution would lose the collaboration semantics. Race Mode is where parallel is the right approach.

### Multi-Agent Collaboration Design

**Team Mode** — 5 Agents in a serial pipeline:
```
Emma(PM) → Bob(Architect) → Alex(Engineer) → Luna(QA) → Sarah(SEO)
```
Each step's output automatically chains into the next step's context. Progress pushed to UI in real-time via `onStepUpdate` callback.

**Race Mode** — `Promise.allSettled()` fires 3 parallel Gemini requests, each streaming independently. Users compare in 3 side-by-side iframe previews and pick the best.

### Development Method

Used Claude Code Sub-Agent parallel development:
- Phase 1: Main Agent builds scaffold, types, routing
- Phase 2: 3 Sub-Agents in parallel (Services / Pages UI / Workspace core)
- Phase 3: 4 Sub-Agents in parallel (Docs / Auth / Deploy / Code Review)
- Total: 7 Sub-Agents, ~30 minutes for initial version

---

## 2. Current Completion Status

### Completed

| Feature | Details |
|---------|---------|
| Landing Page | White clean theme, SVG animal avatars, feature cards, doc links |
| Auth System | Google OAuth + Email/Password signup & login + Demo mode |
| Dashboard | Project CRUD with Supabase persistence, Demo mode fallback |
| Workspace 3-Panel Layout | Chat / Monaco Editor / Preview, draggable panel widths |
| Engineer Mode | Gemini streaming code generation, auto HTML extraction to Preview |
| Team Mode | 5-Agent serial pipeline, real-time progress timeline |
| Race Mode | 3-way parallel generation, iframe comparison, select best |
| Code Editor | Monaco Editor, multi-file tabs, vs-dark theme, syntax highlighting |
| Live Preview | iframe srcdoc, Desktop/Mobile toggle, macOS-style title bar |
| File Tree | Create/delete files, extension-based icons |
| Data Persistence | Conversations, projects, artifacts all stored in Supabase (4 tables + RLS) |
| Platform-Aware System Prompt | Agent knows AtomForge features, answers platform questions with doc links |
| Docs System | Built-in /docs page with Product / Technical / Design Notes tabs |
| Deployment | Vercel auto-deploy + custom domain atomforge.charles-cheng.com |

### Not Completed

| Feature | Progress | Notes |
|---------|----------|-------|
| GitHub Integration UI | Service layer done, UI not wired | `github.ts` has createRepo + pushToGithub, Publish button not connected |
| Version Rollback | Schema done, UI not built | versions table exists, needs version list and rollback button |
| Export ZIP | Not started | — |
| Multi-Model Switch | Not started | Race mode currently Gemini only, could support Claude/GPT comparison |
| Mobile Responsive | Landing OK, Workspace not adapted | 3-panel layout needs tab-switching for mobile |

---

## 3. Expansion Plan & Priorities

### P0 — 2~3 hours
1. **GitHub Integration UI** — Wire Publish button to github.ts, dialog for token + repo name input
2. **Version Snapshots** — Auto-save version on each generation, add version history panel + rollback

### P1 — 3~4 hours
3. **Multi-Model Support** — Abstract LLMProvider interface, add OpenAI/Claude implementations, Race mode cross-model comparison
4. **Export ZIP** — Package current files for download
5. **Workspace Mobile** — Convert 3-panel to tab-switching layout

### P2 — Future Direction
6. **WebContainer** — Replace iframe, support npm packages in preview
7. **Supabase Realtime** — Multi-user real-time collaboration
8. **Custom Agents** — User-defined roles, prompts, pipeline order
9. **Template Marketplace** — Community sharing of generated apps, Fork/Remix support

---

## 4. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + Inline styles (white theme) |
| AI | Google Gemini 2.5 Pro (streaming) |
| Auth | Supabase Auth (Google OAuth + Email) |
| Database | Supabase PostgreSQL (RLS row-level security) |
| Editor | Monaco Editor |
| Preview | iframe srcdoc sandbox |
| Deployment | Vercel (GitHub push auto-deploy) |
| Dev Tools | Claude Code (Agent Team parallel development) |
