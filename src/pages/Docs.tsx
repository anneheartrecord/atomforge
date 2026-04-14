import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Book, Code2, Lightbulb, Globe } from 'lucide-react';
import Header from '../components/layout/Header';

type Lang = 'zh' | 'en';

const tabs = [
  { id: 'product', label: { zh: '产品', en: 'Product' }, icon: <Book size={16} /> },
  { id: 'technical', label: { zh: '技术', en: 'Technical' }, icon: <Code2 size={16} /> },
  { id: 'design', label: { zh: '设计说明', en: 'Design Notes' }, icon: <Lightbulb size={16} /> },
];

function renderMarkdown(md: string): string {
  // 1. Code blocks
  let html = md.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:#f1f5f9;padding:16px;border-radius:8px;overflow-x:auto;font-size:13px;line-height:1.6;margin:16px 0"><code>$2</code></pre>');

  // 2. Tables — find blocks of | lines and wrap in <table>
  html = html.replace(/((?:^\|.+\|$\n?)+)/gm, (tableBlock) => {
    const rows = tableBlock.trim().split('\n').filter(r => r.trim());
    let tableHtml = '<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">';
    rows.forEach((row, i) => {
      const cells = row.split('|').filter(c => c.trim());
      if (cells.every(c => /^[-:\s]+$/.test(c))) return; // skip separator
      const tag = i === 0 ? 'th' : 'td';
      const bgStyle = i === 0 ? 'background:#f8fafc;font-weight:600;' : '';
      tableHtml += '<tr>' + cells.map(c =>
        `<${tag} style="padding:10px 14px;border:1px solid #e2e8f0;text-align:left;${bgStyle}">${c.trim()}</${tag}>`
      ).join('') + '</tr>';
    });
    tableHtml += '</table>';
    return tableHtml;
  });

  // 3. Headers
  html = html.replace(/^#### (.+)$/gm, '<h4 style="font-size:16px;font-weight:600;margin:24px 0 8px;color:#0f172a">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:18px;font-weight:600;margin:32px 0 12px;color:#0f172a">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:22px;font-weight:700;margin:40px 0 16px;color:#0f172a;padding-bottom:8px;border-bottom:1px solid #e2e8f0">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:28px;font-weight:700;margin:0 0 24px;color:#0f172a">$1</h1>');

  // 4. Inline formatting
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:13px">$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#3b82f6;text-decoration:none">$1</a>');

  // 5. Lists
  html = html.replace(/^- (.+)$/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>');
  html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul style="list-style:disc;padding-left:24px;margin:8px 0">$1</ul>');

  // 6. Paragraphs (lines not already wrapped in HTML tags)
  html = html.replace(/^(?!<[hulitdprat])((?!<).+)$/gm, '<p style="margin:8px 0;line-height:1.75">$1</p>');

  // 7. Double newlines to breaks
  html = html.replace(/\n\n/g, '<br/>');

  return html;
}

// ── 双语文档内容 ──────────────────────────────────────────

const docs: Record<string, Record<Lang, string>> = {
  product: {
    zh: `# AtomForge — 产品文档

## 概述

AtomForge 是一个 AI 驱动的代码生成平台，通过自然语言描述将想法转化为可运行的 Web 应用。平台部署了一支专业 AI Agent 团队，通过明确的角色分工协作——就像一个真实的软件开发团队。

## 核心功能

### 1. 多 Agent 协作（团队模式）
五个专业 Agent 按流水线顺序协作：
- **Emma**（产品经理）— 分析需求，输出结构化 PRD
- **Bob**（架构师）— 设计技术架构和组件结构
- **Alex**（工程师）— 编写生产级、自包含的代码
- **Luna**（测试工程师）— 审查代码质量，发现 Bug
- **Sarah**（SEO 专家）— 优化搜索引擎表现和性能

### 2. 赛马模式
同一 prompt 发送给 3 个并行 AI 实例，在实时预览中对比输出，选择最优方案。适合探索不同设计方向。

### 3. 工程师模式
与 Alex（工程师 Agent）一对一直接对话。快速高效的代码生成，支持流式输出。适合快速原型开发。

### 4. 实时代码预览
生成的代码在沙箱 iframe 中即时渲染。支持桌面端/移动端视图切换。macOS 风格的预览窗口，支持刷新和全屏。

### 5. Monaco 代码编辑器
VS Code 级别的编辑器，支持语法高亮、多文件标签页和实时编辑。修改即时同步到预览。

### 6. 数据持久化
所有对话和生成产物通过 Supabase 保存到云端。跨会话、跨设备持久化。

## Agent 角色

| Agent | 角色 | 职责 |
|-------|------|------|
| Emma | 产品经理 | 将模糊想法转化为结构化需求 |
| Bob | 架构师 | 设计技术蓝图 |
| Alex | 工程师 | 编写实际代码 |
| Luna | 测试工程师 | 发现 Bug，提出改进建议 |
| Sarah | SEO 专家 | 优化搜索和性能 |

## 快速开始

1. 使用 Google 或邮箱**登录**
2. 在 Dashboard **创建项目**
3. **选择模式**：工程师（快速）/ 团队（全面）/ 赛马（探索）
4. 在聊天框中**描述你的需求**
5. 在预览面板中**观看代码生成**`,

    en: `# AtomForge — Product Documentation

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
5. **Watch it come to life** in the preview panel`,
  },

  technical: {
    zh: `# AtomForge — 技术文档

## 架构

\`\`\`
浏览器 (SPA)
├── React 18 + TypeScript + Vite
├── Tailwind CSS (白色主题)
├── Monaco Editor (代码编辑)
├── iframe sandbox (预览)
├── Services
│   ├── Gemini API (AI 生成)
│   ├── Supabase (认证 + 数据库 + 存储)
│   └── GitHub API (代码推送)
└── 部署在 Vercel + 自定义域名
\`\`\`

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端 | React 18 + Vite + TypeScript |
| 样式 | Tailwind CSS + Inline styles |
| AI | Google Gemini（流式生成）|
| 认证 | Supabase Auth（Google OAuth + 邮箱）|
| 数据库 | Supabase PostgreSQL |
| 编辑器 | Monaco Editor |
| 预览 | iframe srcdoc sandbox |
| 部署 | Vercel（GitHub push 自动部署）|

## 数据库 Schema

**projects** — 用户项目/任务
**conversations** — 每个项目的聊天消息（pid 外键）
**artifacts** — 生成的代码文件、图片等产物（pid 外键）
**versions** — 项目快照，用于版本回滚（pid 外键）

所有表使用行级安全策略（RLS）—— 用户只能访问自己的数据。

## Agent 编排

### 团队模式流水线
\`\`\`
Emma → Bob → Alex → Luna → Sarah
  ↓       ↓       ↓       ↓       ↓
 PRD    架构     代码    审查    SEO
\`\`\`
每一步的输出通过 \`teamOrchestrator.ts\` 作为上下文传递给下一步。

### 赛马模式
\`Promise.allSettled()\` 并行发起 3 个 Gemini 请求。每个请求使用 \`streamGenerateCode\` 实时流式输出。结果在并排的 iframe 预览中展示。

## 本地开发

\`\`\`bash
git clone https://github.com/anneheartrecord/atomforge
cd atomforge
npm install
cp .env.example .env.local  # 填入 API 密钥
npm run dev                  # http://localhost:5173
\`\`\`

## 环境变量

- \`VITE_SUPABASE_URL\` — Supabase 项目 URL
- \`VITE_SUPABASE_ANON_KEY\` — Supabase 公开匿名密钥
- \`VITE_GEMINI_API_KEY\` — Google Gemini API 密钥`,

    en: `# AtomForge — Technical Documentation

## Architecture

\`\`\`
Browser (SPA)
├── React 18 + TypeScript + Vite
├── Tailwind CSS (white theme)
├── Monaco Editor (code editing)
├── iframe sandbox (preview)
├── Services
│   ├── Gemini API (AI generation)
│   ├── Supabase (Auth + Database + Storage)
│   └── GitHub API (code push)
└── Deployed on Vercel + Custom Domain
\`\`\`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + Inline styles |
| AI | Google Gemini (streaming) |
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
- \`VITE_GEMINI_API_KEY\` — Google Gemini API key`,
  },

  design: {
    zh: `# AtomForge — 实现说明

## 功能优先级判断

基于对 Atoms.dev 的深度使用体验，我认为以下功能对 MVP 最关键：

**基础能力层**：登录认证、代码生成、产物展示（实时预览）、下载导出、GitHub 推送。

**Agent 核心能力层**：多轮上下文管理、用户记忆提取与注入、Team 模式（多 Agent 协作流水线）、Race 模式（并行对比）。

**交互设计层**：参考 Atoms 的重要设计——**隐藏模型选择、固定 Team 成员**。降低上手门槛，让非技术用户也能快速使用。

## 架构取舍

**纯前端 + Supabase + Vercel**：代码几乎只有前端 TS，后端持久化直接用 Supabase，部署在个人域名上。零后端、零运维。

**Gemini 作为 LLM**：coding 能力不是特别稳定，但支持浏览器直调（CORS），和纯前端架构完全契合。

**iframe srcdoc**：WebContainer 需要付费许可且冷启动慢。AI 生成自包含 HTML，iframe srcdoc 零依赖、即时渲染。

**Team Mode 串行**：流水线本质是上下文逐步精化，串行保证每步输入质量。Race Mode 才是并行的正确场景。

## 当前完成功能

| 功能 | 说明 |
|------|------|
| 登录认证 | Google OAuth + Email + Demo 模式 |
| Dashboard | 默认对话入口 + 项目管理 |
| 三栏 Workspace | Chat / Editor / Preview，可拖拽、FileTree 可折叠 |
| Engineer 模式 | Gemini 流式生成 + 多轮上下文 |
| Team 模式 | 5 Agent 串行流水线 |
| Race 模式 | 3 路并行对比 |
| 用户记忆 | 自动提取偏好/事实，下次对话注入 |
| Markdown 渲染 | 加粗、代码块、列表、链接 |
| GitHub 推送 | Token + Repo 一键推送 |
| 下载导出 | 一键导出 HTML |
| 数据持久化 | Supabase 5 张表 + RLS |
| 文档系统 | /docs 中英双语 |
| 部署 | Vercel + atomforge.charles-cheng.com |

## 未来优化

**近期功能点**：
- 代码版本快照 + 回滚
- 多模型支持：自动拆解任务匹配模型（Plan/高难度 → SOTA 模型；低难度 → 快速模型）
- 优秀 Demo 案例展示

**大方向思考**：

Atoms 做对了"入门门槛足够低"——隐藏模型选择、固定 Team 成员。这是很好的 trade-off，尤其对没有技术背景的用户。

但未来 Agent 平台的方向可能是**"入门易、进阶深"**：
- **入门层**：一句话生成应用，不需要理解技术概念
- **进阶层**：自定义 Team、自选模型、Agent 间条件分支
- **专家层**：Agent SDK，编程式编排复杂工作流

竞争壁垒不在 AI 多强（模型层的事），在于**编排层的灵活性和工程体验的打磨**。`,

    en: `# AtomForge — Implementation Notes

## Feature Priority

Based on deep usage of Atoms.dev, these features are critical for MVP:

**Foundation**: Login, code generation, live preview, download, GitHub push.

**Agent Core**: Multi-turn context, user memory, Team Mode pipeline, Race Mode parallel comparison.

**Interaction Design**: Following Atoms' key decision — **hiding model selection, fixing Team members**. Lowers entry barrier for non-technical users.

## Architecture Trade-offs

**Pure frontend + Supabase + Vercel**: Almost entirely frontend TS. Backend persistence via Supabase. Zero servers, zero ops.

**Gemini as LLM**: Coding capability not consistently stable, but supports browser-direct calls (CORS), fits pure frontend architecture.

**iframe srcdoc**: WebContainer needs paid license and slow cold starts. Self-contained HTML renders instantly in iframe.

**Team Mode serial**: Pipeline requires progressive context refinement. Race Mode is for parallel scenarios.

## Completed Features

| Feature | Details |
|---------|---------|
| Auth | Google OAuth + Email + Demo mode |
| Dashboard | Default chat entry + project CRUD |
| 3-Panel Workspace | Chat / Editor / Preview, draggable, FileTree collapsible |
| Engineer Mode | Gemini streaming + multi-turn context |
| Team Mode | 5-agent serial pipeline |
| Race Mode | 3-way parallel comparison |
| User Memory | Auto-extract preferences, inject next time |
| Markdown | Bold, code blocks, lists, links |
| GitHub Push | Token + Repo one-click push |
| Download | One-click HTML export |
| Persistence | Supabase 5 tables + RLS |
| Docs | /docs bilingual (CN/EN) |
| Deploy | Vercel + atomforge.charles-cheng.com |

## Future Directions

**Near-term**:
- Version snapshots + rollback
- Multi-model: auto task decomposition (complex → SOTA; simple → fast models)
- Demo showcase gallery

**Big picture**:

Atoms got "low entry barrier" right — hidden model selection, fixed Team. Great trade-off for non-technical users.

But future Agent platforms need **"easy to start, deep to master"**:
- **Entry**: One sentence to generate an app
- **Advanced**: Custom Teams, model selection, conditional branching
- **Expert**: Agent SDK for programmatic orchestration

Competitive moat isn't AI strength (model layer), it's **orchestration flexibility and engineering experience polish**.`,
  },
};

export default function Docs() {
  const [activeTab, setActiveTab] = useState('product');
  const [lang, setLang] = useState<Lang>('zh');

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '96px 32px 64px' }}>
        {/* Top bar: Back + Language */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}>
            <ArrowLeft size={14} /> {lang === 'zh' ? '返回首页' : 'Back to home'}
          </Link>
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
              borderRadius: 8, border: '1px solid var(--color-border)', background: 'none',
              cursor: 'pointer', fontSize: 13, color: 'var(--color-text-secondary)',
            }}
          >
            <Globe size={14} />
            {lang === 'zh' ? 'English' : '中文'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40, borderBottom: '1px solid #e2e8f0' }}>
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
              {tab.icon} {tab.label[lang]}
            </button>
          ))}
        </div>

        {/* Content */}
        <article
          style={{ color: '#334155', fontSize: 15, lineHeight: 1.75 }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(docs[activeTab]?.[lang] || '') }}
        />
      </div>
    </div>
  );
}
