import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Book, Code2, Lightbulb } from 'lucide-react';
import Header from '../components/layout/Header';

const tabs = [
  { id: 'product', label: 'Product', icon: <Book size={16} /> },
  { id: 'technical', label: 'Technical', icon: <Code2 size={16} /> },
  { id: 'design', label: 'Design Notes', icon: <Lightbulb size={16} /> },
];

// Simple markdown-to-HTML (handles headers, bold, lists, code blocks, links)
function renderMarkdown(md: string): string {
  return md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:#f1f5f9;padding:16px;border-radius:8px;overflow-x:auto;font-size:13px;line-height:1.6;margin:16px 0"><code>$2</code></pre>')
    // Headers
    .replace(/^#### (.+)$/gm, '<h4 style="font-size:16px;font-weight:600;margin:24px 0 8px;color:#0f172a">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:18px;font-weight:600;margin:32px 0 12px;color:#0f172a">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:22px;font-weight:700;margin:40px 0 16px;color:#0f172a;padding-bottom:8px;border-bottom:1px solid #e2e8f0">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:28px;font-weight:700;margin:0 0 24px;color:#0f172a">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:13px">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#3b82f6;text-decoration:none">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul style="list-style:disc;padding-left:24px;margin:8px 0">$1</ul>')
    // Tables (basic)
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => /^[-:\s]+$/.test(c))) return '';
      const tag = 'td';
      return '<tr>' + cells.map(c => `<${tag} style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${c.trim()}</${tag}>`).join('') + '</tr>';
    })
    // Paragraphs
    .replace(/^(?!<[hulitdrap])((?!<).+)$/gm, '<p style="margin:8px 0;line-height:1.75">$1</p>')
    // Line breaks
    .replace(/\n\n/g, '<br/>');
}

// Docs content embedded at build time (imported as raw strings)
const PRODUCT_DOC = `# AtomForge — Product Documentation

## Overview

AtomForge is an AI-powered code generation platform that turns natural language descriptions into production-ready web applications. Instead of a single AI assistant, AtomForge deploys a team of specialized AI agents that collaborate through defined roles — just like a real software development team.

## Core Features

### 1. Multi-Agent Collaboration (Team Mode)
Five specialized agents work in a sequential pipeline:
- **Emma** (Product Manager) — Analyzes requirements and outputs a structured PRD
- **Bob** (Architect) — Designs technical architecture and component structure
- **Alex** (Engineer) — Writes production-ready, self-contained code
- **Luna** (QA Engineer) — Reviews code quality and identifies bugs
- **Sarah** (SEO Specialist) — Optimizes for search engines and performance

### 2. Race Mode
Send the same prompt to 3 parallel AI instances. Compare outputs side-by-side in live previews. Pick the best solution. Great for exploring different design directions.

### 3. Engineer Mode
Direct one-on-one with Alex (the Engineer agent). Fast, efficient code generation with streaming output. Best for quick prototyping.

### 4. Live Code Preview
Generated code renders instantly in a sandboxed iframe. Switch between Desktop and Mobile views. macOS-style preview window with refresh and fullscreen.

### 5. Monaco Code Editor
VS Code-grade editor with syntax highlighting, multi-file tabs, and real-time editing. Changes sync instantly to the preview.

### 6. Data Persistence
All conversations and generated artifacts are saved to the cloud via Supabase. Your work persists across sessions and devices.

## Agent Roles

| Agent | Role | What They Do |
|-------|------|-------------|
| Emma | Product Manager | Turns vague ideas into structured requirements |
| Bob | Architect | Designs the technical blueprint |
| Alex | Engineer | Writes the actual code |
| Luna | QA Engineer | Finds bugs and suggests improvements |
| Sarah | SEO Specialist | Optimizes for search and performance |

## Getting Started

1. **Sign in** with Google or email
2. **Create a project** from the Dashboard
3. **Choose a mode**: Engineer (fast) / Team (thorough) / Race (exploratory)
4. **Describe what you want** in the chat
5. **Watch it come to life** in the preview panel
`;

const TECHNICAL_DOC = `# AtomForge — Technical Documentation

## Architecture

\`\`\`
Browser (SPA)
├── React 18 + TypeScript + Vite
├── Tailwind CSS (white theme)
├── Monaco Editor (code editing)
├── iframe sandbox (preview)
│
├── Services
│   ├── Gemini 2.5 Pro API (AI generation)
│   ├── Supabase (Auth + Database + Storage)
│   └── GitHub API (code push)
│
└── Deployed on Vercel + Custom Domain
\`\`\`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + Inline styles |
| AI | Google Gemini 2.5 Pro (streaming) |
| Auth | Supabase Auth (Google OAuth + Email) |
| Database | Supabase PostgreSQL |
| Editor | Monaco Editor |
| Preview | iframe srcdoc sandbox |
| Deployment | Vercel (auto-deploy from GitHub) |

## Database Schema

**projects** — User projects/tasks
**conversations** — Chat messages per project (pid FK)
**artifacts** — Generated code files, images (pid FK)
**versions** — Project snapshots for rollback (pid FK)

All tables use Row Level Security (RLS) — users can only access their own data.

## Agent Orchestration

### Team Mode Pipeline
\`\`\`
Emma → Bob → Alex → Luna → Sarah
  ↓       ↓       ↓       ↓       ↓
 PRD   Arch    Code   Review   SEO
\`\`\`
Each step feeds its output as context to the next via \`teamOrchestrator.ts\`.

### Race Mode
\`Promise.allSettled()\` fires 3 parallel Gemini requests. Each uses \`streamGenerateCode\` for real-time streaming. Results displayed in side-by-side iframe previews.

## Local Development

\`\`\`bash
git clone https://github.com/anneheartrecord/atomforge
cd atomforge
npm install
cp .env.example .env.local  # Fill in API keys
npm run dev                  # http://localhost:5173
\`\`\`

## Environment Variables

- \`VITE_SUPABASE_URL\` — Supabase project URL
- \`VITE_SUPABASE_ANON_KEY\` — Supabase public anon key
- \`VITE_GEMINI_API_KEY\` — Google Gemini API key
`;

const DESIGN_DOC = `# AtomForge — Design Notes

## Key Decisions

### Why React + Vite (not Next.js)?
SPA is sufficient — no SEO needed for a dev tool. Vite gives sub-second HMR. Static deploy to Vercel is trivial.

### Why iframe srcdoc (not WebContainer)?
WebContainer is powerful but: (1) needs paid license, (2) heavy cold start, (3) overkill for single-file HTML preview. iframe srcdoc is zero-dependency and instant.

### Why Supabase (not IndexedDB)?
Real cloud persistence across devices. Built-in Auth (Google OAuth in 3 lines). RLS for data isolation. Free tier is generous.

### Why Gemini (not Claude/GPT)?
User requirement. Bonus: Gemini supports browser-direct calls (CORS), so zero backend needed.

### Team Mode: Serial vs Parallel?
Serial by design — each agent needs the previous agent's output as context. Parallel would lose the "collaboration" semantic and degrade to Race Mode.

## Development Process

Built with **Claude Code Agent Team** — 7 parallel sub-agents:

| Phase | Agents | Output |
|-------|--------|--------|
| Init | Main agent | Scaffold, config, types |
| Core | 3 agents parallel | Services / Pages / Workspace |
| Polish | 4 agents parallel | Docs / Auth / Deploy / Review |

**Total: ~30 minutes from zero to production build.**

## Current Status

### Done
- Landing page with agent avatars
- Google OAuth + Email login
- Dashboard with CRUD
- 3-panel workspace (Chat / Editor / Preview)
- Team Mode (5-agent pipeline)
- Race Mode (3-way parallel)
- Supabase persistence
- Cloudflare/Vercel deploy

### Not Done
- Version rollback UI
- Export ZIP
- Multi-model support in Race Mode
- Mobile responsive workspace
`;

const docs: Record<string, string> = {
  product: PRODUCT_DOC,
  technical: TECHNICAL_DOC,
  design: DESIGN_DOC,
};

export default function Docs() {
  const [activeTab, setActiveTab] = useState('product');

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '96px 32px 64px' }}>
        {/* Back */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14, marginBottom: 32 }}>
          <ArrowLeft size={14} /> Back to home
        </Link>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40, borderBottom: '1px solid #e2e8f0', paddingBottom: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.2s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <article
          style={{ color: '#334155', fontSize: 15, lineHeight: 1.75 }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(docs[activeTab] || '') }}
        />
      </div>
    </div>
  );
}
