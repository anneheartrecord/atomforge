# AtomForge — Implementation Notes

## 1. Implementation Approach & Key Trade-offs

### Feature Priority

Based on deep hands-on experience with Atoms.dev, I identified these features as critical for an AI Agent code generation platform MVP:

**Foundation layer**: Login, code generation, live preview, download, GitHub push — the baseline for a usable product.

**Agent core layer**: Multi-turn context management, user memory extraction & injection, Team Mode (multi-agent pipeline), Race Mode (parallel comparison) — the essential leap from Chatbot to Agent.

**Interaction design layer**: Following a key design decision from Atoms — **hiding model selection and fixing Team members**. This is an excellent trade-off: lowering the barrier to entry so non-technical users can start immediately. No need to understand GPT-4 vs Claude, no need to configure which agents do what — just describe what you want.

My implementation strategy: **prioritize getting all core features running at minimum viable level**, rather than perfecting any single feature.

### Architecture Trade-offs

**Pure frontend + Supabase + Vercel**: For rapid deployment, the project is almost entirely frontend TypeScript. Backend persistence uses Supabase (Auth + PostgreSQL + RLS), deployed on Vercel (auto-deploy on GitHub push), hosted on personal domain `atomforge.charles-cheng.com`. Zero backend servers, zero ops overhead.

**Gemini as LLM**: Coding capability is not consistently stable — sometimes generates high-quality code, sometimes produces incomplete structures. But Gemini's key advantage: browser-direct calls (CORS support), no backend proxy needed, perfectly aligned with the "pure frontend" architecture.

**iframe srcdoc over WebContainer**: WebContainer can run full Node.js but needs paid license and slow cold starts. AI-generated code is self-contained HTML (inline CSS/JS), iframe srcdoc is zero-dependency and instant.

**Team Mode serial over parallel**: Pipeline essence is progressive context refinement — architects need the PRD, engineers need the architecture. Serial ensures input quality for each step.

### Multi-Agent Collaboration

**Team Mode** — 5 fixed roles in serial pipeline:
```
Emma(PM) → Bob(Architect) → Alex(Engineer) → Luna(QA) → Sarah(SEO)
```
Each output chains into the next step's context. Users just describe requirements, everything else is automatic.

**Race Mode** — `Promise.allSettled()` fires 3 parallel requests, each streaming independently. Users compare in 3 side-by-side iframe previews.

**Agent Memory System** — Automatically extracts user preferences (tech stack, design style) and project context from conversations, stores in Supabase, injects into next conversation.

### Development Method

Claude Code Sub-Agent parallel development, 7 Sub-Agents total, ~30 minutes for initial version.

---

## 2. Current Completion Status

### Completed

| Feature | Details |
|---------|---------|
| Authentication | Google OAuth + Email/Password + Demo mode |
| Landing Page | White theme, SVG animal avatars, feature cards, doc links |
| Dashboard | Default chat entry (type and go) + project CRUD |
| 3-Panel Workspace | Chat / Monaco Editor / Preview, draggable widths |
| FileTree Toggle | Built into Editor tab bar, one-click hide/show |
| Engineer Mode | Gemini streaming with multi-turn context (Gemini chat API) |
| Team Mode | 5-agent serial pipeline with real-time progress |
| Race Mode | 3-way parallel, iframe comparison, select best |
| Live Preview | iframe srcdoc, Desktop/Mobile toggle |
| Code Editor | Monaco Editor, multi-file tabs, syntax highlighting |
| Markdown Rendering | Bold, italic, code blocks, lists, links in chat |
| Platform-Aware Prompt | Agent knows AtomForge features, includes doc links |
| User Memory | Auto-extract preferences/facts, store in Supabase, inject next time |
| Data Persistence | All data in Supabase (5 tables + RLS) |
| GitHub Push | Toolbar Git button, input Token + Repo, one-click push |
| Download Export | Toolbar Download button, export as HTML |
| Docs System | Built-in /docs with bilingual (CN/EN) support |
| Deployment | Vercel auto-deploy + atomforge.charles-cheng.com |
| Chinese Output | System Prompt defaults to Chinese responses |
| Secret Protection | Pre-commit hook scans for API key leaks |

### Not Completed

| Feature | Notes |
|---------|-------|
| Version snapshots + rollback | Schema exists, UI not built |
| Multi-model support | Currently Gemini only |
| Demo showcase gallery | Community templates / App World |
| Mobile Workspace | 3-panel needs tab-switching for mobile |

---

## 3. Future Directions

### Near-term Features

**Version Snapshots + Rollback**: Auto-save on each generation. Version history panel with one-click rollback. High-value for iterative development.

**Multi-Model + Smart Task Matching**: Not just manual model selection, but automatic task decomposition:
- Planning & complex architecture → SOTA models (Claude Opus, GPT-4o)
- Simple code generation → Fast models (Gemini Flash, Claude Haiku)
- Code review → Analysis-specialized models

**Demo Showcase Gallery**: Built-in high-quality examples. New users immediately see what's possible. One-click Fork/Remix.

### Big Picture

My current takeaway from Atoms-like products: **Atoms got "low entry barrier" right**. Hidden model selection, fixed Team members, one-sentence start — these designs let non-technical people use the platform effectively.

But the trend I observe: **future Agent platforms need to be "easy to start, deep to master"**:

- **Entry level**: Keep the minimal experience — one sentence to generate an app
- **Advanced level**: Custom Teams (user-defined agents, prompts, pipeline order), model selection, conditional branching between agents, external API/tool integration
- **Expert level**: Open Agent SDK for programmatic workflow orchestration

Like Notion's success path — appears simple, but underlying capabilities run deep. The competitive moat for Agent platforms isn't "how strong the AI is" (that's the model layer), but **orchestration flexibility and engineering experience polish**.

---

## 4. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + Inline styles (white theme) |
| AI | Google Gemini 2.5 Flash (streaming, multi-turn) |
| Auth | Supabase Auth (Google OAuth + Email) |
| Database | Supabase PostgreSQL (5 tables + RLS) |
| Editor | Monaco Editor |
| Preview | iframe srcdoc sandbox |
| Deployment | Vercel (auto-deploy) + atomforge.charles-cheng.com |
| Dev Tools | Claude Code (Agent Team parallel development) |
