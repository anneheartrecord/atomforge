# AtomForge — 设计笔记与关键取舍

## 一、项目亮点

### 1. 多 Agent 协作架构（Team Mode 流水线编排）

AtomForge 的 Team 模式实现了一条完整的 5 Agent 串行流水线：`Emma(PM) → Bob(Architect) → Alex(Engineer) → Luna(QA) → Sarah(SEO)`。核心设计在 `teamOrchestrator.ts` 中——每一步的输出通过 `contextualPrompt` 拼接为下一步的输入上下文，形成类似真实软件团队的工作流。编排器通过 `onStepUpdate` 回调实时向 UI 推送状态变更，前端的 `TeamPipeline` 组件以时间线形式渲染每个 Agent 的 `pending → running → completed` 状态流转，用户可以逐步观察到需求从 PRD 到架构到代码到审查的完整演进过程。这不是简单的多次 API 调用，而是一个有明确语义的生产流水线。

### 2. 赛马模式（Race Mode 并行调用 + 实时对比）

`raceRunner.ts` 使用 `Promise.allSettled()` 并行发起多路 Gemini 流式请求，同一 prompt 独立生成多份代码。每个 entry 有独立的 `onChunk` 回调，通过 `onUpdate([...entries])` 实时向 UI 推送所有条目的最新状态。`RaceView` 组件将多个结果以网格布局并排展示，每个卡片内嵌独立的 iframe 实时预览，用户可以展开对比、选择最优方案后一键切换回 Engineer 模式继续迭代。这个设计的价值在于——同一个 LLM 在不同采样下会产生风格迥异的输出，赛马机制让用户获得了"选择权"而非"接受权"。

### 3. Gemini 2.5 Pro 流式代码生成 + 自动 HTML 提取渲染

`gemini.ts` 封装了三个层次的生成函数：`generateCode`（同步）、`streamGenerateCode`（流式）、`generateWithRole`（带角色流式）。流式生成基于 `generateContentStream()` 返回的 AsyncIterator，逐 chunk 回调到 UI 层。`Workspace.tsx` 中的 `extractHtmlFromResponse()` 实现了多策略 HTML 提取——先尝试 markdown 代码围栏，再尝试 DOCTYPE/html 开头检测，最后用正则兜底。提取出的 HTML 直接写入 `files['index.html']`，触发 Preview 组件重新渲染。整个链路做到了"用户输入 → AI 流式生成 → 自动提取代码 → 实时预览"的闭环，中间无需人工干预。

### 4. 三栏可拖拽工作空间

`Workspace.tsx` 中的 `useDraggablePanel` Hook 实现了三栏（Chat/Editor/Preview）的百分比宽度拖拽。核心思路是监听 `mousedown` 标记拖拽目标（左分隔线或右分隔线），在 `mousemove` 中根据鼠标在容器内的相对位置计算百分比，通过 `Math.min/Math.max` 限制 15%-50% 的范围防止面板被压扁。中栏宽度通过 `100 - leftW - rightW` 自动计算，三栏始终铺满。这个实现不依赖任何拖拽库，纯原生事件，代码不到 30 行，性能开销几乎为零。

### 5. Supabase 全栈持久化（RLS 行级安全 + Google OAuth）

数据层设计了 `projects`、`conversations`、`versions` 三张表，全部启用 Row Level Security。RLS 策略基于 `auth.uid() = user_id` 实现行级隔离，子表（conversations/versions）通过子查询关联到 projects 表的 user_id，确保用户只能访问自己的数据。`supabase.ts` 提供了完整的 CRUD 操作封装，类型与 `types/index.ts` 中的 TypeScript 接口一一对应。认证层支持 Google OAuth，并提供 Demo 模式 fallback——未配置 OAuth 凭证时仍可以 mock 用户体验完整流程。

### 6. 对标 Atoms.dev 的暗色 UI 系统

整个应用采用深色主题（`#0c0c0c` 背景），UI 细节对标 Atoms.dev：Preview 组件模拟 macOS 窗口标题栏（红黄绿三色圆点 + URL 栏），聊天气泡区分用户（`#1a2744` 深蓝）和 Agent（`#1a1a1a` 深灰），每个 Agent 有独立的品牌色（Emma 粉、Bob 蓝、Alex 绿、Luna 紫、Sarah 黄）。分隔线统一使用 `rgba(255,255,255,0.06)` 的微透明白色，配合 Tailwind 的 `backdrop-blur` 和渐变背景，整体视觉一致性高。

### 7. 纯前端架构，零后端服务器成本

AtomForge 是一个完全运行在浏览器中的 SPA。Gemini API 通过 `@google/generative-ai` SDK 从浏览器直接调用（Gemini 原生支持 CORS），Supabase 通过 anon key 直连（安全性由 RLS 保证），GitHub 集成使用用户自己的 Personal Access Token 调用 Git Data API。构建产物是纯静态文件，可以部署到 Cloudflare Pages / Vercel / Netlify 等任何静态托管平台，无需维护任何后端服务器，运营成本仅为域名费用。

### 8. 完善的工程化基础

TypeScript 严格模式（`tsc -b` 在构建前强制类型检查）、Zustand 全局状态管理、模块化目录结构（agents/services/hooks/components/pages 五层分离）、ESLint 代码规范、Vite 极速 HMR。依赖选型克制——React 19 + React Router 7 + Tailwind 4 + Zustand 5，核心运行时依赖仅 7 个，没有引入不必要的抽象层。类型定义集中在 `types/index.ts`，Agent 配置、项目数据、对话消息、版本快照均有完整的接口定义。

## 二、实现思路与关键取舍

### 为什么选 React + Vite 而不是 Next.js / Nuxt

AtomForge 本质上是一个交互密集的工具型 SPA，不需要 SEO、不需要 SSR、不需要 API Routes。Next.js 的 App Router 和 Server Components 在这个场景下是纯粹的复杂度负担——代码生成和预览全部发生在浏览器端，没有任何数据需要在服务端预渲染。选择 Vite + React 的组合意味着：构建配置接近零（`vite.config.ts` 不到 10 行）、HMR 速度亚秒级、构建产物是纯静态文件可以部署到任何 CDN。对于一个面试 Demo 项目，这种"最小复杂度"的选型是正确的——把时间花在业务逻辑而不是框架配置上。

### 为什么用 iframe srcdoc 而不是 WebContainer

WebContainer（StackBlitz 的浏览器端 Node.js 运行时）确实功能更强大——可以运行 npm install、支持完整的 Node.js 生态。但它有三个问题：（1）商业许可需要付费；（2）加载体积大，首次启动慢；（3）对于"生成一个自包含 HTML 页面"这个需求，它是严重过度工程化的。iframe srcdoc 的方案极其轻量——浏览器原生支持，零额外依赖，`sandbox="allow-scripts allow-same-origin"` 提供安全隔离，渲染延迟几乎为零。Gemini 的 System Prompt 明确要求输出自包含 HTML（CSS/JS 全部内联），这个约束确保了 srcdoc 方案的可行性。当然，这也意味着无法预览使用 npm 包的项目——但这是 Demo 阶段有意为之的边界。

### 为什么 Supabase 而不是纯 IndexedDB

如果只是本地持久化，IndexedDB 足够了。但 Supabase 提供了三个 IndexedDB 无法替代的能力：（1）真正的云端存储——用户换一台电脑登录，数据还在；（2）内置 Auth——Google OAuth 只需要几行配置，不需要自己实现认证流程；（3）RLS 行级安全——数据隔离在数据库层面完成，前端不需要额外的权限逻辑。对于面试评审来说，"有一个真实的数据持久化方案"和"用 localStorage 凑合"传达的工程能力完全不同。Supabase 的 anon key + RLS 模式允许前端直连数据库，不需要额外的后端服务，与"纯前端架构"的定位完全兼容。

### 为什么 Gemini 而不是 Claude / GPT

首要原因是用户指定。但从技术角度看，Gemini 2.5 Pro 有一个关键优势：**支持浏览器直接调用**。`@google/generative-ai` SDK 在浏览器环境下可以直接发起 HTTPS 请求，不存在 CORS 限制。相比之下，OpenAI API 默认不允许浏览器直调（需要后端代理），Claude API 同样需要服务端转发。这意味着选择 Gemini 可以保持"零后端"的架构纯粹性。另外 Gemini 2.5 Pro 的 100 万 token 上下文窗口对 Team 模式的多步上下文串联非常友好——5 个 Agent 的累积输出不容易超出上下文限制。

### Team 模式的串行 vs 并行设计取舍

Team 模式选择了严格串行执行（`for` 循环逐步调用），而非并行。原因是：流水线的本质是**上下文的逐步精化**——Emma 的 PRD 是 Bob 设计架构的前提，Bob 的架构文档是 Alex 写代码的前提。如果并行执行，每个 Agent 只能拿到用户的原始 prompt，丢失了"分工协作"的语义，退化为 Race 模式的变种。串行的代价是总耗时等于各步骤之和（约 30-60 秒），但换来的是每一步输出的质量——后续 Agent 能基于前序 Agent 的结构化输出进行更精准的工作。这也是为什么要同时提供 Race 模式：当用户需要速度时用 Race，需要质量时用 Team，两种策略互补。

### Monaco Editor 的选择理由

代码编辑器有三个选项：CodeMirror 6、Monaco、Ace。选择 Monaco 的原因：（1）它是 VS Code 的编辑器内核，用户最熟悉的代码编辑体验；（2）`@monaco-editor/react` 封装良好，React 集成开箱即用；（3）内置对 HTML/CSS/JS/TypeScript 的语法高亮和智能提示，不需要额外配置语言支持；（4）`vs-dark` 主题与 AtomForge 的暗色 UI 天然匹配。代价是 Monaco 的体积较大（约 2MB gzip），但对于一个代码生成平台来说，编辑器是核心体验组件，这个体积是值得的。

### 前端直调 AI API 的安全性取舍

当前架构下，Gemini API Key 通过 `VITE_GEMINI_API_KEY` 环境变量注入，构建后会内联到 JS bundle 中。这意味着任何人打开浏览器 DevTools 都能看到 API Key。对于 Demo 项目这是可以接受的——API Key 有配额限制，且 Gemini 的免费额度足够演示使用。但在生产环境中，这绝对不可行。正确的做法是：搭建一个轻量的后端代理（Cloudflare Workers / Vercel Edge Functions），前端请求发往代理，由代理附加 API Key 后转发给 Gemini。Supabase 的 anon key 则不存在这个问题——它的安全性由 RLS 策略保证，即使暴露 anon key，未认证用户也无法读写任何数据。

## 三、当前完成程度

### 已完成功能

| 模块 | 功能 | 说明 |
|------|------|------|
| Landing 页面 | 暗色主题首页 | Hero 区域带输入框、5 个 Agent 角色卡片展示、功能特性卡片、CTA 按钮 |
| 认证系统 | Google OAuth 登录 | Supabase Auth 集成，代码层面完整支持 OAuth 流程，附带 Demo 模式 fallback（未配置凭证时可跳过登录） |
| Dashboard | 项目管理 | 创建新项目 / 删除项目 / 点击跳转到 Workspace，卡片式布局 |
| Workspace 布局 | 三栏可拖拽 | Chat（左）/ Editor（中）/ Preview（右），拖拽分隔线调整宽度，15%-50% 范围限制 |
| Agent 对话 | 流式代码生成 | Gemini 2.5 Pro 流式输出，逐 chunk 更新消息气泡，Markdown 代码块渲染，流式光标动画 |
| 代码预览 | iframe srcdoc 渲染 | 实时预览生成的 HTML，Desktop / Mobile 设备切换，macOS 风格标题栏（三色圆点 + URL 栏），刷新 / 全屏按钮 |
| 代码编辑器 | Monaco Editor | 多文件 Tab 切换，vs-dark 主题语法高亮，内容编辑实时同步到预览 |
| 文件树 | 文件管理 | 新建文件 / 删除文件，按扩展名显示图标，点击切换活跃文件 |
| Team 模式 | 5 Agent 流水线 | Emma → Bob → Alex → Luna → Sarah 串行编排，实时进度时间线，输出串联为上下文，错误中断机制 |
| Race 模式 | 并行对比生成 | 3 路并行流式生成，网格布局对比预览，展开/收起切换，选择最优方案后回到 Engineer 模式 |
| 数据库 Schema | Supabase 表结构 | projects / conversations / versions 三表 + RLS 策略 + 自动更新触发器，SQL 脚本就绪 |
| GitHub 集成 | Git Data API 推送 | 基于 create tree → create commit → update ref 的原子化推送，支持创建仓库 + 推送文件 |
| CI/CD | Cloudflare Pages | `.github/workflows` 配置，push to main 自动构建部署 |
| 文档 | 完整技术文档 | 产品文档（PRODUCT.md）、技术文档（TECHNICAL.md）、部署指南、中英文双语 README |
| HTML 提取 | 多策略自动提取 | 从 AI 响应中自动提取 HTML：markdown 围栏 → DOCTYPE 检测 → 正则兜底，三级 fallback |
| 消息渲染 | 简易 Markdown | 代码块高亮、行内 code 渲染、Agent 头像和品牌色区分、时间戳显示 |

### 未完成 / 部分完成功能

| 模块 | 状态 | 说明 |
|------|------|------|
| Supabase 实际接入 | 部分完成 | Schema 和服务层代码已写好，前端 Workspace 暂用 mock 数据（`MOCK_MESSAGES` / `MOCK_TEAM_STEPS` / `MOCK_RACE_ENTRIES`），Dashboard 和 Auth 的 hook 已写但未接线 |
| Google OAuth 真实流程 | 部分完成 | `useAuth` hook 和 Login 页面代码就绪，需在 Google Cloud Console 配置 OAuth 客户端 ID 并在 Supabase Dashboard 启用 Google Provider |
| GitHub 集成 UI | 部分完成 | `github.ts` 服务层完整（createRepo + pushToGithub），Workspace 的 Publish 按钮存在但未接线到服务层 |
| 导出 ZIP 功能 | 未开始 | 计划支持将当前文件打包为 ZIP 下载 |
| 深色/亮色主题切换 | 未开始 | 当前仅暗色主题，样式硬编码在组件中 |
| 移动端响应式 | 未优化 | 三栏布局在窄屏下不可用，需要折叠为 Tab 切换模式 |

## 四、如果继续投入时间的扩展计划

### P0 — 核心闭环（预计 2-3h）

| 任务 | 时间估算 | 说明 |
|------|----------|------|
| 接入真实 Supabase | 1h | 填入 `.env.local` 的 Supabase URL 和 anon key，执行 `supabase-schema.sql` 建表，将 Workspace 中的 mock 数据替换为 `useProject` / `useChat` hook 调用 |
| Google OAuth 真实配置 | 30min | 在 Google Cloud Console 创建 OAuth 2.0 客户端，在 Supabase Dashboard 配置 Google Provider，设置回调 URL |
| Dashboard 数据从 Supabase 拉取 | 1h | Dashboard 页面调用 `getProjects()` 获取用户项目列表，创建 / 删除走 `createProject()` / `deleteProject()` |

### P1 — 数据持久化与版本管理（预计 3-4h）

| 任务 | 时间估算 | 说明 |
|------|----------|------|
| 对话历史持久化 | 1.5h | 每条消息调用 `addConversation()` 写入 Supabase，进入 Workspace 时通过 `getConversations()` 恢复历史对话 |
| 版本快照功能 | 1.5h | 每次 AI 生成代码后自动调用 `createVersion()` 存储当前文件快照，UI 增加版本列表和回滚按钮 |
| GitHub 集成 UI | 1h | Workspace 工具栏的 Publish 按钮接入 `pushToGithub()`，弹出对话框让用户输入 GitHub Token 和仓库名 |

### P2 — 预览增强与多模型支持（预计 4-6h）

| 任务 | 时间估算 | 说明 |
|------|----------|------|
| WebContainer 集成 | 3h | 引入 `@webcontainer/api`，在 Preview 组件中检测生成代码是否包含 `import` / `require`，如有则切换到 WebContainer 运行时，支持 npm 包的完整预览 |
| 多模型切换 | 2h | `gemini.ts` 抽象为统一的 `LLMProvider` 接口，新增 `openai.ts` 和 `claude.ts` 实现，Workspace 工具栏增加模型选择下拉框 |
| Race 模式支持不同模型对比 | 1h | Race 的每个 entry 可以指定不同的 `LLMProvider`，实现跨模型的同 prompt 对比 |

### P3 — 未来方向

| 任务 | 说明 |
|------|------|
| Supabase Realtime 多人协作 | 利用 Supabase 的 Realtime 订阅功能，多用户可以同时编辑同一个项目，实时同步文件变更和对话消息 |
| AI Agent 自定义 | 用户可以自定义 Agent 角色——修改名称、头像、System Prompt，甚至调整流水线顺序和步骤数量 |
| 模板市场 / App World | 社区共享生成的应用模板，用户可以 fork 他人的项目作为起点，形成内容生态 |
| Stripe 支付集成 | 按 API 调用量计费，免费层 + Pro 订阅模式，Race 模式消耗更多额度 |

## 五、开发方式说明

本项目使用 **Claude Code** 作为主要开发工具，采用 **Agent Team 并行开发模式**，整个项目从零到构建成功约 **30 分钟**。

### 开发流程

**第一阶段：架构与初始化（主 Agent）**

主 Agent 负责项目架构设计、目录结构规划、依赖选型、`package.json` / `tsconfig.json` / `vite.config.ts` 等基础配置文件的生成。确定了核心类型定义（`types/index.ts`）和模块边界后，将开发任务拆分为可并行的子任务。

**第二阶段：核心模块并行开发（3 个 Sub-Agent）**

| Sub-Agent | 职责 | 产出 |
|-----------|------|------|
| Sub-Agent 1 | 服务层 | `gemini.ts`（三个生成函数）、`supabase.ts`（CRUD 封装）、`github.ts`（Git Data API）、`supabaseClient.ts`（客户端初始化） |
| Sub-Agent 2 | 页面 UI | `Landing.tsx`（首页）、`Login.tsx`（登录页）、`Dashboard.tsx`（项目列表）、Landing 子组件（Hero / Features / AgentShowcase） |
| Sub-Agent 3 | Workspace 核心 | `Workspace.tsx`（三栏布局 + 拖拽）、`ChatPanel.tsx`、`CodeEditor.tsx`、`FileTree.tsx`、`Preview.tsx`、`TeamPipeline.tsx`、`RaceView.tsx` |

三个 Sub-Agent 基于预先定义好的类型接口并行工作，互不阻塞。

**第三阶段：收尾与整合（4 个 Sub-Agent）**

| Sub-Agent | 职责 | 产出 |
|-----------|------|------|
| Sub-Agent 4 | 文档 | `PRODUCT.md`、`TECHNICAL.md`、`README.md`、`README_EN.md` |
| Sub-Agent 5 | Supabase 配置 | `supabase-schema.sql`（建表 + RLS + 触发器）、`.env.example` |
| Sub-Agent 6 | Agent 编排整合 | `prompts.ts`（5 个 Agent 的 System Prompt）、`teamOrchestrator.ts`（流水线编排）、`raceRunner.ts`（并行运行器） |
| Sub-Agent 7 | 部署配置 | `.github/workflows/deploy.yml`（Cloudflare Pages CI/CD）、Zustand Store、路由配置 |

**第四阶段：主 Agent 整合验收**

主 Agent 合并所有 Sub-Agent 的产出，解决接口不一致、import 路径错误等整合问题，运行 `tsc -b && vite build` 确认构建通过。

### 这种开发模式的优势

- **并行度高**：7 个 Sub-Agent 分两批并行执行，总耗时远小于串行开发
- **职责清晰**：每个 Sub-Agent 只关注自己的模块，类型接口是唯一的契约
- **与项目理念呼应**：AtomForge 本身是一个 Multi-Agent 协作平台，用 Multi-Agent 方式开发它，形成了一种"自举"（bootstrapping）的叙事——工具的开发过程本身就是工具理念的验证
