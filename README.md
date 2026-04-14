[English](./README_EN.md)

# AtomForge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Pro-4285F4?logo=google&logoColor=white)](https://ai.google.dev)

**AI Agent 驱动的代码生成平台。** 通过自然语言对话，由多个专业 AI Agent 协作完成从需求分析到代码实现的全流程。

## 功能

- 🤖 **Agent 对话** — 自然语言描述需求，AI 直接生成可运行的前端代码
- 👥 **团队模式** — 5 个 AI Agent（产品经理→架构师→工程师→QA→SEO 专家）按流水线协作
- 🏁 **赛马模式** — 同一需求并行生成多份方案，对比选优
- 👁️ **实时预览** — iframe 沙箱实时渲染生成结果
- 🔄 **流式输出** — 代码生成过程实时可见
- 📦 **GitHub 集成** — 一键推送代码到 GitHub 仓库
- 💾 **版本管理** — 自动保存项目快照，支持版本回溯
- 🔐 **用户认证** — Supabase Auth，数据行级安全隔离

## 快速开始

### 前置条件

- Node.js >= 18
- [Supabase](https://supabase.com) 项目
- [Google Gemini API Key](https://ai.google.dev)

### 安装与运行

```bash
# 克隆项目
git clone <repo-url>
cd atomforge

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 Supabase 和 Gemini 的密钥

# 初始化数据库（在 Supabase SQL Editor 中执行 supabase-schema.sql）

# 启动开发服务器
npm run dev
```

浏览器访问 `http://localhost:5173`。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript 6 |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand 5 |
| AI 模型 | Google Gemini 2.5 Pro |
| 后端服务 | Supabase（Auth + PostgreSQL） |
| 代码编辑器 | Monaco Editor |
| 图标 | Lucide React |
| 路由 | React Router 7 |

## 项目结构

```
src/
├── agents/          # AI Agent 编排（System Prompt、流水线、赛马）
├── components/      # UI 组件（按功能模块分目录）
├── hooks/           # 自定义 Hooks（useChat、useAuth、useProject、useTeamMode）
├── lib/             # 基础库初始化（Supabase Client）
├── pages/           # 页面组件（Landing、Login、Dashboard、Workspace）
├── services/        # 外部服务封装（Gemini、Supabase、GitHub）
├── store/           # Zustand 全局状态
└── types/           # TypeScript 类型定义
```

## 部署

AtomForge 是纯前端应用，构建产物为静态文件：

```bash
npm run build
```

将 `dist/` 目录部署到 Vercel、Netlify、Cloudflare Pages 等平台。部署时需配置以下环境变量：

| 变量 | 说明 |
|------|------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `VITE_GEMINI_API_KEY` | Google Gemini API 密钥 |

## 文档

- [技术文档 (中文)](./docs/TECHNICAL.md) | [Technical Docs (EN)](./docs/TECHNICAL_EN.md)
- [实现说明 (中文)](./docs/DESIGN_NOTES.md) | [Implementation Notes (EN)](./docs/DESIGN_NOTES_EN.md)
- [在线文档](https://atomforge.charles-cheng.com/docs)

## License

[MIT](./LICENSE)
