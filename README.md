[English](./README_EN.md)

# AtomForge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Live Demo](https://img.shields.io/badge/Demo-atomforge.charles--cheng.com-blue)](https://atomforge.charles-cheng.com)

**AI Agent 驱动的代码生成平台。** 描述你的想法，一支 AI Agent 团队协作将其变为可运行的代码。

> 🔗 **在线体验**: [atomforge.charles-cheng.com](https://atomforge.charles-cheng.com)
> 📖 **在线文档**: [atomforge.charles-cheng.com/docs](https://atomforge.charles-cheng.com/docs)
> 💻 **源码**: [github.com/anneheartrecord/atomforge](https://github.com/anneheartrecord/atomforge)

## 设计思路

基于对 [Atoms.dev](https://atoms.dev) 的深度使用，我认为一个 AI Agent 代码生成平台的核心在于：

1. **基础能力**：登录、代码生成、产物预览、下载导出、GitHub 推送
2. **Agent 能力**：多轮上下文、用户记忆、Team 模式（多 Agent 流水线）、Race 模式（并行对比）
3. **交互设计**：参考 Atoms 的重要决策——隐藏模型选择、固定 Team 成员，降低上手门槛

LLM 使用 Gemini，coding 能力不是特别稳定，但支持浏览器直调（CORS），和纯前端架构完全契合。

为了快速跑起来，代码几乎只有前端 TS，后端持久化直接使用 Supabase，部署用 Vercel。

## 功能

### Agent 核心
- 🤖 **工程师模式** — 与 Alex（工程师 Agent）直接对话，流式生成代码，支持多轮上下文
- 👥 **团队模式** — Emma(PM) → Bob(架构) → Alex(工程) → Luna(测试) → Sarah(SEO) 串行流水线
- 🏁 **赛马模式** — 同一 prompt 并行生成 3 种方案，对比选优
- 🧠 **记忆系统** — 自动提取用户偏好和项目上下文，下次对话注入

### 产物管理
- 👁️ **实时预览** — iframe 沙箱即时渲染，Desktop/Mobile 切换
- 📝 **Monaco 编辑器** — VS Code 级代码编辑，多文件 Tab，语法高亮
- 📁 **文件树** — 一键折叠/展开，新建/删除文件
- ⬇️ **下载导出** — 一键导出为 HTML 文件
- 🔀 **GitHub 推送** — 输入 Token + Repo 名一键推送

### 平台能力
- 🔐 **认证** — Google OAuth + Email 注册登录 + Demo 模式
- 💾 **持久化** — 对话、项目、产物全部存 Supabase（5 张表 + RLS）
- 📖 **文档** — 内置 /docs 页面，中英双语
- 🎨 **白色主题** — 小清新 UI，Agent 动物头像

## 快速开始

```bash
git clone https://github.com/anneheartrecord/atomforge
cd atomforge
npm install
cp .env.example .env.local  # 填入 API 密钥
npm run dev                  # http://localhost:5173
```

### 环境变量

| 变量 | 说明 |
|------|------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `VITE_GEMINI_API_KEY` | Google Gemini API 密钥 |

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端 | React 18 + Vite + TypeScript |
| AI | Google Gemini 2.5 Flash（流式、multi-turn） |
| 认证 | Supabase Auth（Google OAuth + Email） |
| 数据库 | Supabase PostgreSQL（RLS 行级安全） |
| 编辑器 | Monaco Editor |
| 预览 | iframe srcdoc sandbox |
| 部署 | Vercel + atomforge.charles-cheng.com |

## 项目结构

```
src/
├── agents/        # Agent 编排（prompts、teamOrchestrator、raceRunner）
├── components/    # UI 组件（workspace、dashboard、landing、team、race）
├── hooks/         # 自定义 Hooks（useChat、useAuth、useProject）
├── pages/         # 页面（Landing、Login、Dashboard、Workspace、Docs）
├── services/      # 外部服务（gemini、supabase、github）
├── store/         # Zustand 全局状态
└── types/         # TypeScript 类型定义
```

## 文档

- [实现说明（中文）](./docs/DESIGN_NOTES.md) — 实现思路、关键取舍、完成度、未来方向
- [Implementation Notes (EN)](./docs/DESIGN_NOTES_EN.md)
- [技术文档（中文）](./docs/TECHNICAL.md) — 架构、API、部署指南
- [Technical Docs (EN)](./docs/TECHNICAL_EN.md)
- [在线文档](https://atomforge.charles-cheng.com/docs) — 中英双语

## 未来方向

- **版本快照 + 回滚**：每次生成自动存版本
- **多模型 + 智能匹配**：自动拆解任务，高难度用 SOTA 模型，低难度用快速模型
- **"入门易、进阶深"**：保持极简入门体验，同时支持自定义 Team、自选模型、Agent SDK

## License

[MIT](./LICENSE)
