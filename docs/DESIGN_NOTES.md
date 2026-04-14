# AtomForge — 实现说明

## 一、实现思路与关键取舍

### 整体架构

AtomForge 是一个纯前端 SPA，通过浏览器直连 Gemini API 和 Supabase，不需要任何自建后端服务器。用户描述需求后，AI Agent 团队协作生成可运行的代码，并在 iframe 中实时预览。

```
React SPA (Vite + TypeScript)
  ├── Gemini 2.5 Pro API  ← 浏览器直调（CORS 支持）
  ├── Supabase            ← Auth + PostgreSQL + RLS
  └── Vercel              ← 自动部署
```

### 关键取舍

**React + Vite vs Next.js**
选 SPA 不选 SSR。理由：这是一个工具型应用，不需要 SEO，不需要服务端渲染。SPA 构建产物是纯静态文件，部署到 Vercel 零配置。Next.js 的 App Router 和 Server Components 在这个场景下是纯粹的复杂度负担。

**iframe srcdoc vs WebContainer**
选轻量方案。WebContainer 能跑完整 Node.js，但需要付费许可证、冷启动慢、内存占用高。AI 生成的代码是自包含 HTML（CSS/JS 全部内联），iframe srcdoc 零依赖、零延迟、够用。

**Supabase vs IndexedDB**
选云端持久化。IndexedDB 是纯本地方案，换设备数据就没了。Supabase 提供真正的跨设备云存储 + 内置 Auth（Google OAuth 几行代码接入）+ RLS 行级安全。

**Gemini vs Claude/GPT**
Gemini 支持浏览器直调（CORS），不需要后端代理。这让整个架构保持"零后端"的纯粹性。

**Team Mode 串行 vs 并行**
选串行。流水线的本质是上下文的逐步精化——架构师需要 PRD，工程师需要架构设计。并行会丢失协作语义。Race Mode 才是并行的正确场景。

### 多 Agent 协作设计

**Team Mode** — 5 个 Agent 串行流水线：
```
Emma(PM) → Bob(架构) → Alex(工程) → Luna(测试) → Sarah(SEO)
```
每步输出自动串联为下一步的上下文输入。通过 `onStepUpdate` 回调实时向 UI 推送进度。

**Race Mode** — `Promise.allSettled()` 并行发起 3 个 Gemini 请求，每个独立流式输出，用户在 3 个 iframe 预览中对比选择。

### 开发方式

使用 Claude Code 的 Sub-Agent 并行开发模式：
- 第一阶段：主 Agent 搭建脚手架、类型定义、路由
- 第二阶段：3 个 Sub-Agent 并行（服务层 / 页面 UI / Workspace 核心）
- 第三阶段：4 个 Sub-Agent 并行（文档 / Auth / 部署 / 代码审查）
- 总计 7 个 Sub-Agent，约 30 分钟完成初始版本

---

## 二、当前完成程度

### 已完成

| 功能 | 说明 |
|------|------|
| Landing 页面 | 白色小清新主题、Agent 动物头像（SVG）、功能卡片、文档链接 |
| 认证系统 | Google OAuth + Email/Password 注册登录 + Demo 模式 |
| Dashboard | 项目创建/删除/跳转，Supabase 真实持久化（登录用户），Demo 模式 fallback |
| Workspace 三栏布局 | Chat / Monaco Editor / Preview，可拖拽调整宽度 |
| Engineer 模式 | Gemini 2.5 Pro 流式代码生成，自动提取 HTML 渲染到 Preview |
| Team 模式 | 5 Agent 串行流水线，实时进度时间线，输出上下文串联 |
| Race 模式 | 3 路并行生成，iframe 对比预览，选择最优方案 |
| 代码编辑器 | Monaco Editor，多文件 Tab，vs-dark 主题，语法高亮 |
| 实时预览 | iframe srcdoc，Desktop/Mobile 切换，macOS 风格标题栏 |
| 文件树 | 新建/删除文件，扩展名图标 |
| 数据持久化 | 对话记录、项目数据、生成产物全部存 Supabase（4 张表 + RLS） |
| 平台感知 System Prompt | Agent 了解 AtomForge 的功能，能回答平台问题并附带文档链接 |
| 文档系统 | 内置 /docs 页面（Product / Technical / Design Notes 三个 Tab） |
| 部署 | Vercel 自动部署 + 自定义域名 atomforge.charles-cheng.com |

### 未完成

| 功能 | 进度 | 说明 |
|------|------|------|
| GitHub 集成 UI | 服务层完成，UI 未接线 | `github.ts` 写好了 createRepo + pushToGithub，Workspace 的 Publish 按钮未对接 |
| 版本回滚 | Schema 完成，UI 未实现 | versions 表已建，缺少版本列表和回滚按钮 |
| 导出 ZIP | 未开始 | — |
| 多模型切换 | 未开始 | Race 模式目前只用 Gemini，未来可支持 Claude/GPT 对比 |
| 移动端适配 | Landing 基本适配，Workspace 未适配 | 三栏布局需要改为 Tab 切换 |

---

## 三、扩展计划与优先级

### P0 — 2~3 小时
1. **GitHub 集成 UI** — Workspace Publish 按钮接入 github.ts，弹窗输入 token + repo 名
2. **版本快照** — 每次代码生成自动存 version，UI 添加版本历史面板和回滚

### P1 — 3~4 小时
3. **多模型支持** — 抽象 LLMProvider 接口，新增 OpenAI/Claude 实现，Race 模式支持跨模型对比
4. **导出 ZIP** — 将当前文件打包下载
5. **Workspace 移动端适配** — 三栏改为底部 Tab 切换

### P2 — 未来方向
6. **WebContainer** — 替换 iframe，支持 npm 包的完整预览
7. **Supabase Realtime** — 多人实时协作
8. **自定义 Agent** — 用户定义角色、prompt、流水线顺序
9. **模板市场** — 社区共享生成的应用，支持 Fork/Remix

---

## 四、技术栈

| 层面 | 技术 |
|------|------|
| 前端 | React 18 + Vite + TypeScript |
| 样式 | Tailwind CSS + Inline styles（白色主题） |
| AI | Google Gemini 2.5 Pro（流式生成） |
| 认证 | Supabase Auth（Google OAuth + Email） |
| 数据库 | Supabase PostgreSQL（RLS 行级安全） |
| 编辑器 | Monaco Editor |
| 预览 | iframe srcdoc sandbox |
| 部署 | Vercel（GitHub push 自动部署） |
| 开发工具 | Claude Code（Agent Team 并行开发） |
