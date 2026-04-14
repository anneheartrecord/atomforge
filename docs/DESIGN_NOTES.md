# AtomForge — 实现说明

## 一、实现思路与关键取舍

### 功能优先级判断

基于对 Atoms.dev 的深度使用体验，我认为以下功能对于一个 AI Agent 代码生成平台的 MVP 来说是最关键的：

**基础能力层**：登录认证、代码生成、产物展示（实时预览）、下载导出、GitHub 推送——这是最小可用产品的底线。

**Agent 核心能力层**：多轮上下文管理、用户记忆提取与注入、Team 模式（多 Agent 协作流水线）、Race 模式（并行对比）——这是从 Chatbot 到 Agent 的本质跃迁。

**交互设计层**：参考 Atoms 的一个重要设计决策——**隐藏模型选择、固定 Team 成员**。这是一个很好的 trade-off：降低上手门槛，让没有技术背景的用户也能快速使用。不需要理解 GPT-4 和 Claude 的区别，不需要知道产品经理 Agent 和工程师 Agent 该怎么配，直接告诉平台你想做什么就好。

所以我的实现策略是：**优先保证这些核心功能能最小粒度跑起来**，而不是追求单个功能的完美度。

### 架构取舍

**纯前端 + Supabase + Vercel**：为了快速跑起来，整个项目几乎只有前端 TypeScript 代码。后端持久化直接使用 Supabase（Auth + PostgreSQL + RLS），部署用 Vercel（GitHub push 自动部署），挂在个人域名 `atomforge.charles-cheng.com` 上。零后端服务器，零运维成本。

**Gemini 作为 LLM**：体验下来感觉 Gemini 的 coding 能力不是特别稳定——有时候生成的代码质量很高，有时候会出现结构不完整或者样式问题。但 Gemini 有一个关键优势：支持浏览器直调（CORS），不需要后端代理，和"纯前端架构"的定位完全契合。

**iframe srcdoc 而不是 WebContainer**：WebContainer 能跑完整 Node.js，但需要付费许可证、冷启动慢。AI 生成的是自包含 HTML（CSS/JS 全部内联），iframe srcdoc 零依赖、即时渲染，Demo 阶段够用。

**Team Mode 串行而不是并行**：流水线的本质是上下文的逐步精化——架构师需要产品经理的 PRD，工程师需要架构师的方案。串行保证了每一步的输入质量。Race Mode 才是并行的正确场景。

### 多 Agent 协作设计

**Team Mode** — 5 个固定角色串行流水线：
```
Emma(产品经理) → Bob(架构师) → Alex(工程师) → Luna(测试) → Sarah(SEO)
```
每步输出自动串联为下一步的上下文。用户只需要描述需求，剩下的全自动。

**Race Mode** — `Promise.allSettled()` 并行发起 3 个请求，每个独立流式输出，用户在 3 个 iframe 预览中对比选择最优方案。

**Agent 记忆系统** — 从对话中自动提取用户偏好（技术栈、设计风格）和项目上下文，存入 Supabase，下次对话自动注入。让 Agent 逐渐"了解"用户。

### 开发方式

使用 Claude Code 的 Sub-Agent 并行开发模式，总计 7 个 Sub-Agent，约 30 分钟完成初始版本：
- 第一阶段：主 Agent 搭建脚手架、类型定义、路由
- 第二阶段：3 个 Sub-Agent 并行（服务层 / 页面 UI / Workspace 核心）
- 第三阶段：4 个 Sub-Agent 并行（文档 / Auth / 部署 / 代码审查）

---

## 二、当前完成程度

### 已完成

| 功能 | 说明 |
|------|------|
| 登录认证 | Google OAuth + Email/Password 注册登录 + Demo 模式 fallback |
| Landing 页面 | 白色主题、Agent 动物头像（SVG）、功能卡片、文档链接 |
| Dashboard | 默认对话入口（直接输入开始）+ 项目管理（创建/删除/跳转） |
| Workspace 三栏布局 | Chat / Monaco Editor / Preview，可拖拽调整宽度 |
| FileTree 折叠 | Editor tab 栏内置折叠按钮，一键隐藏/显示文件树 |
| Engineer 模式 | Gemini 流式代码生成，多轮上下文（Gemini multi-turn chat） |
| Team 模式 | 5 Agent 串行流水线，实时进度时间线，输出上下文串联 |
| Race 模式 | 3 路并行生成，iframe 对比预览，选择最优方案 |
| 实时预览 | iframe srcdoc，Desktop/Mobile 切换，macOS 风格标题栏 |
| 代码编辑器 | Monaco Editor，多文件 Tab，语法高亮 |
| Markdown 渲染 | 对话中支持加粗、斜体、代码块、列表、链接渲染 |
| 平台感知 System Prompt | Agent 了解 AtomForge 功能，回答平台问题时附带文档链接 |
| 用户记忆系统 | 自动提取偏好/事实/风格，存入 Supabase，下次对话注入 |
| 数据持久化 | 对话记录、项目数据、生成产物全部存 Supabase（5 张表 + RLS） |
| GitHub 推送 | 工具栏 Git 按钮，输入 Token + Repo 名一键推送代码 |
| 下载导出 | 工具栏 Download 按钮，一键导出为 HTML 文件 |
| 文档系统 | 内置 /docs 页面，中英双语，Product / Technical / Design Notes 三个 Tab |
| 部署 | Vercel 自动部署 + 自定义域名 atomforge.charles-cheng.com |
| AI 中文输出 | System Prompt 默认中文回复 |
| 密钥安全 | Pre-commit hook 自动扫描 API Key 泄露 |

### 未完成

| 功能 | 说明 |
|------|------|
| 代码版本快照 + 回滚 | Schema 已建，UI 未实现 |
| 多模型支持 | 当前只用 Gemini，未来支持 Claude/GPT |
| 优秀 Demo 案例展示 | 社区模板 / App World |
| 移动端 Workspace 适配 | 三栏布局需要改为 Tab 切换 |

---

## 三、未来优化方向

### 近期功能点

**代码版本快照 + 回滚**
每次 AI 生成代码后自动存储 version 快照。UI 上添加版本历史面板，点击即可回滚到任意历史版本。这在迭代过程中非常有价值——"刚才那个版本更好"是高频场景。

**多模型支持 + 智能任务匹配**
不只是让用户手动选模型，而是自动拆解任务并匹配：
- Plan 和高难度架构任务 → 使用 SOTA 模型（Claude Opus、GPT-4o）
- 简单代码生成 → 使用快速模型（Gemini Flash、Claude Haiku）
- 代码审查 → 使用擅长分析的模型
这样既保证质量又控制成本。

**优秀 Demo 案例**
内置一批高质量的生成案例，新用户一进来就能看到"这个平台能做什么"。支持一键 Fork/Remix，降低冷启动门槛。

### 大方向思考

现在我对 Atoms 这类产品的体感是：**Atoms 做对了"入门门槛足够低"这件事**。隐藏模型选择、固定 Team 成员、一句话开始构建——这些设计让完全没有技术背景的人也能用起来。

但我观察到的趋势是，**未来 Agent 平台的发展方向可能是"入门易、进阶深"**：

- **入门层**：保持现有的极简体验，一句话生成应用，不需要理解任何技术概念
- **进阶层**：支持自定义 Team（用户定义 Agent 角色、System Prompt、流水线顺序）、支持自选模型、支持 Agent 间的条件分支和循环、支持接入外部 API/工具
- **专家层**：开放 Agent SDK，让开发者可以编程式地编排复杂的 Agent 工作流

这就像 Notion 的成功路径——看起来简单，但底层能力足够深。未来 Agent 平台的竞争壁垒不在于"AI 有多强"（这是模型层的事），而在于**编排层的灵活性和工程体验的打磨**。

---

## 四、技术栈

| 层面 | 技术 |
|------|------|
| 前端 | React 18 + Vite + TypeScript |
| 样式 | Tailwind CSS + Inline styles（白色主题） |
| AI | Google Gemini 2.5 Flash（流式生成、multi-turn chat） |
| 认证 | Supabase Auth（Google OAuth + Email） |
| 数据库 | Supabase PostgreSQL（5 张表 + RLS 行级安全） |
| 编辑器 | Monaco Editor |
| 预览 | iframe srcdoc sandbox |
| 部署 | Vercel（GitHub push 自动部署）+ atomforge.charles-cheng.com |
| 开发工具 | Claude Code（Agent Team 并行开发） |
