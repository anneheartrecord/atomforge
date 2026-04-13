# AtomForge — 设计笔记与关键取舍

## 一、项目亮点

### 1. 多 Agent 协作架构（Team Mode 流水线编排）

Team 模式实现了一条 5 步串行流水线：`Emma(PM) → Bob(Architect) → Alex(Engineer) → Luna(QA) → Sarah(SEO)`。核心设计在于**上下文的链式传递**——`teamOrchestrator.ts` 中通过 `previousOutput` 变量在 `for` 循环中逐步累积，每一步的 prompt 由 `Original user request + Previous step output` 二段式结构组成。这不是简单地把 5 个 Agent 拼在一起，而是模拟了一个真实软件团队的工作流：需求分析 → 架构设计 → 编码实现 → 质量审查 → 性能优化。`onStepUpdate` 回调将每个 Agent 的 `pending → running → completed` 状态实时推送到前端 `TeamPipeline` 组件，用户可以逐步观察整个流水线的推进。任意环节出错则 `break` 中断，避免下游 Agent 在垃圾输入上浪费 token。

### 2. 赛马模式（Race Mode 并行调用 + 实时对比）

`raceRunner.ts` 使用 `Promise.allSettled()` 并行发起 N 路（默认 3 路）流式生成请求。每一路都是独立的 `streamGenerateCode` 调用，各自通过闭包捕获自己的 `index`，在 `onChunk` 回调中实时更新对应 entry 的 output。选择 `allSettled` 而非 `all` 是有意为之的——即使某一路失败，其他路的结果仍然有效，不会因为单点故障丢失所有成果。前端 `RaceView` 组件以网格布局并排展示多个 iframe 预览，每张卡片带 macOS 三色圆点标题栏、Expand/Collapse 切换和 Select 按钮。用户选择最优方案后，代码直接写入 `files['index.html']` 并切回 Engineer 模式继续迭代。同一个 LLM 在不同采样下会产生风格迥异的输出，赛马机制让用户获得了"选择权"而非"接受权"。

### 3. Gemini 2.5 Pro 流式代码生成 + 自动 HTML 提取渲染

Gemini 服务层（`gemini.ts`）封装了三个核心函数：`generateCode`（非流式）、`streamGenerateCode`（流式，Engineer/Race 模式）、`generateWithRole`（带自定义 system prompt，Team 模式）。流式生成基于 `generateContentStream()` 返回的 AsyncIterator，通过 `for await...of` 逐 chunk 回调到 UI 层。生成完成后，`Workspace.tsx` 中的 `extractHtmlFromResponse` 通过三级 fallback 策略提取 HTML：

1. 优先匹配 markdown code fence（` ```html...``` `）
2. 检测 `<!DOCTYPE` / `<html>` 开头的直接 HTML 输出
3. 正则捕获完整 HTML 文档（`/(<!DOCTYPE[\s\S]*<\/html>)/i`）

提取出的 HTML 直接写入 `files['index.html']`，触发 Preview 组件通过 iframe srcdoc 重渲染，实现"说完即可见"的闭环体验。

### 4. 三栏可拖拽工作空间

Workspace 采用 Chat / Editor / Preview 三栏布局，通过自定义 `useDraggablePanel` Hook 实现拖拽调整宽度。实现原理：两个栏之间插入 1px 宽的拖拽手柄，监听 `mousedown` 标记拖拽目标（`'left' | 'right'`），在 `mousemove` 中将鼠标位置换算为容器百分比宽度，`Math.min/max` 将每栏限制在 15%~50% 之间。中栏宽度通过 `100 - leftW - rightW` 自动计算，三栏始终满足 100% 约束。整个实现约 30 行代码，零外部依赖，不引入任何拖拽库。默认比例为 30% / 35% / 35%，拖拽响应流畅且不会出现面板被压扁的情况。

### 5. Supabase 全栈持久化（RLS 行级安全 + Google OAuth）

数据层设计了三张核心表：`projects`（项目信息 + JSONB 文件存储）、`conversations`（对话历史）、`versions`（版本快照），全部启用 Row Level Security。RLS 策略基于 `auth.uid() = user_id` 实现租户隔离，conversations 和 versions 通过子查询关联 projects 表的 user_id 做跨表鉴权。`supabase.ts` 服务层提供了完整的 CRUD 接口（`getProjects`、`createProject`、`updateProject`、`deleteProject`、`getConversations`、`addConversation`、`getVersions`、`createVersion`），类型签名严格匹配 `types/index.ts` 中定义的 `Project`、`Conversation`、`Version` 接口。Schema 脚本（`supabase-schema.sql`）包含建表、索引、RLS 策略和 `updated_at` 自动更新触发器，可一键执行。

### 6. 对标 Atoms.dev 的暗色 UI 系统

整个 UI 采用极深暗色调（`#0c0c0c` 背景），搭配低对比度边框（`rgba(255,255,255,0.06)`）和精心挑选的强调色系统：`#4267ff` 主色、`#4ade80` 成功色，5 个 Agent 各有专属色（Emma `#f472b6`、Bob `#60a5fa`、Alex `#4ade80`、Luna `#c084fc`、Sarah `#facc15`）。Preview 面板顶部有 macOS 风格红黄绿三色圆点（`#ff5f57` / `#febc2e` / `#28c840`）和仿浏览器地址栏（`https://project.atomforge.dev`）。Chat 气泡采用不对称圆角设计——用户消息 `16px 16px 4px 16px`（右下角直角），Agent 消息 `16px 16px 16px 4px`（左下角直角）。每条 Agent 消息带圆形头像（emoji + 半透明品牌色背景）和角色色标名称。视觉语言从 Landing 到 Workspace 到 Race View 高度统一。

### 7. 纯前端架构，零后端服务器成本

整个应用是标准的 Vite SPA，构建产物为纯静态文件。三个外部服务全部从浏览器直接调用：Gemini API 通过 `@google/generative-ai` SDK 直调（Gemini 原生支持 CORS）、Supabase 通过匿名密钥 + RLS 直连（安全性由行级策略保证）、GitHub 通过用户 Personal Access Token 调用 Git Data API。部署到 Cloudflare Pages / Vercel / Netlify 后即为零运维、零服务器成本，唯一的运行费用是域名。

### 8. 完善的工程化基础

- **TypeScript 严格模式**：`tsc -b` 在构建前强制类型检查。所有核心类型集中定义在 `types/index.ts`——`AgentRole`（联合类型 5 个角色）、`WorkspaceMode`（3 种模式）、`TeamStep`（流水线步骤状态）、`RaceEntry`（赛马条目）、`ChatMessage`（消息体含 `isStreaming` 标记）等，在整个项目中保持类型一致。
- **Zustand 状态管理**：全局状态（用户、项目、对话、模式）通过 Zustand Store 管理，避免多层 prop drilling。
- **模块化目录**：`agents/`（编排逻辑）、`services/`（外部 API 封装）、`hooks/`（业务逻辑）、`components/`（UI 组件按功能域分子目录）、`pages/`（路由页面）五层清晰分离。
- **依赖精简**：核心运行时依赖仅 7 个（React 19、React Router 7、Tailwind 4、Zustand 5、Supabase JS 2、Gemini SDK、Lucide Icons），没有冗余包，`package.json` 干净利落。

---

## 二、实现思路与关键取舍

### 为什么选 React + Vite 而不是 Next.js / Nuxt

AtomForge 是一个纯客户端交互式应用——所有数据来自用户输入和 AI 实时生成，没有 SEO 需求（Workspace 不需要被搜索引擎抓取），没有服务端数据预取场景，也没有 API Routes 需求（所有外部 API 都从浏览器直调）。Next.js 的 SSR/SSG/Server Components 在这里是完全多余的复杂度。选择 Vite SPA 意味着：

- 构建产物就是一个 `dist/` 文件夹，丢到任何静态托管上即可运行
- 不需要 Node.js 服务端运行时，不需要 Serverless Function
- `vite.config.ts` 不到 10 行，构建配置接近零
- HMR 亚秒级，开发体验极其流畅
- 部署链路最短——一个 `npm run build` 搞定一切

对于面试 Demo 项目，"最小复杂度"是正确的选型策略——把时间花在业务逻辑和 Agent 编排上，而不是框架配置上。

### 为什么用 iframe srcdoc 而不是 WebContainer

这是本项目最核心的架构取舍。WebContainer（StackBlitz 开源的浏览器内 Node.js 运行时）可以运行完整的 npm 生态，功能上更强大，但它有三个硬伤：

1. **许可证限制**：WebContainer 的商业使用需要付费许可，Demo 项目不值得。
2. **体积与性能**：WebContainer 运行时约 10MB+，首次加载需要下载和初始化，对用户体感有明显影响。
3. **复杂度溢出**：Gemini 的 System Prompt 明确要求输出自包含 HTML（CSS/JS 全部内联），这个约束下根本不需要 `npm install` 和 bundler。

iframe srcdoc 方案的优势是极致轻量——`<iframe srcDoc={html} sandbox="allow-scripts allow-same-origin" />` 一行代码搞定，浏览器原生渲染，零额外依赖，零加载延迟。`sandbox` 属性提供了基本的安全隔离，防止生成的代码访问主页面 DOM 或发起非预期的网络请求。

代价是无法预览使用 npm 包的多文件项目。但这是 Demo 阶段有意为之的边界——当前架构的 `Preview` 组件是可替换的，未来升级到 WebContainer 只需修改渲染层，不影响上游的 Agent 编排和代码生成逻辑。

### 为什么 Supabase 而不是纯 IndexedDB

面试场景下需要展示"真实的全栈工程能力"，IndexedDB 只能做到本地持久化，而 Supabase 提供了四个 IndexedDB 无法替代的能力：

1. **真正的云端持久化**：数据不绑定在某一台设备的浏览器上，换台电脑登录数据还在。
2. **内置 Auth**：Google OAuth 开箱即用，几行配置即可集成完整的认证流程，不需要自建认证服务。
3. **RLS 行级安全**：用 SQL 策略声明式定义权限（`auth.uid() = user_id`），比在应用层手写权限检查更可靠、更不容易出错。
4. **Schema 即文档**：`supabase-schema.sql` 本身就是高可读性的数据模型文档，面试评审一看就能理解数据设计。

关键的是，Supabase 的 anon key + RLS 模式允许前端直连数据库，不需要额外的后端中转服务，与"纯前端架构"的定位完全兼容。投入产出比远高于 IndexedDB。

### 为什么 Gemini 而不是 Claude / GPT

首要原因是项目需求指定了 Gemini。但从技术角度看，Gemini 有一个在本项目架构约束下至关重要的特性：**支持浏览器直接调用，无需后端代理**。`@google/generative-ai` SDK 从前端发起 HTTPS 请求到 Google 服务器，不存在 CORS 问题。对比之下：

- **OpenAI API**：默认不允许浏览器直调，API Key 暴露在客户端属于严重安全隐患，官方文档明确要求通过后端代理。
- **Anthropic API**：同样需要服务端中转，不支持前端直调。

在"纯前端、零后端"的架构约束下，Gemini 是唯一自然的选择。此外，Gemini 2.5 Pro 的百万 token 上下文窗口对 Team 模式的多步上下文串联非常友好——5 个 Agent 的累积输出不容易超出上下文限制。

### Team 模式的串行 vs 并行设计取舍

Team 模式选择了严格串行执行（`for` 循环依次 `await`），而非 5 个 Agent 并行。核心原因是**数据依赖**：

- Bob 的架构设计必须基于 Emma 的 PRD
- Alex 的代码实现必须基于 Bob 的架构方案
- Luna 的 QA 审查必须针对 Alex 写出的代码
- Sarah 的 SEO 优化必须基于实际的代码产出

这不是可以并行的独立任务，而是有严格的因果链。如果并行执行，每个 Agent 只能拿到用户原始 prompt，丢失了"分工协作"的语义，退化为 Race 模式的变种——生成质量会大幅下降。

代价是总耗时等于各步骤之和（约 30-60 秒）。但通过两个手段缓解用户等待焦虑：（1）每步支持流式输出（`onChunk` 回调），用户实时看到 Agent 正在写什么；（2）`TeamPipeline` 组件以时间线 UI 展示进度（竖线连接 + 状态图标：✓ / spinner / ⚠ / clock），视觉上不会觉得"卡住了"。

这也是为什么同时提供 Race 模式：需要速度用 Race（并行），需要质量用 Team（串行），两种策略互补。

### Monaco Editor 的选择理由

代码编辑器有三个备选项：Monaco、CodeMirror 6、Ace Editor。选择 Monaco 的理由：

1. **用户熟悉度**：Monaco 是 VS Code 的编辑器内核，几乎所有开发者都用过 VS Code，操作习惯零学习成本。
2. **开箱即用的语言支持**：内置 HTML/CSS/JS/TS 的完整语法高亮、自动补全和错误提示，无需额外配置 language server。
3. **主题匹配**：`vs-dark` 主题与 AtomForge 的暗色 UI 天然契合。
4. **React 集成成熟**：`@monaco-editor/react` 封装良好，API 稳定。

代价是 Monaco 体积较大（约 2MB gzip）。CodeMirror 6 体积更小，但在"类 IDE 体验"上不如 Monaco。对于一个以代码生成为核心功能的平台，编辑器体验是刚性需求，这个体积值得。

### 前端直调 AI API 的安全性取舍

当前架构中，Gemini API Key 通过 `VITE_GEMINI_API_KEY` 环境变量注入前端，构建后会内联到 JS bundle 中——任何人打开 DevTools 的 Network 面板都能看到 API Key。在 Demo 环境下这是可以接受的：

- Gemini API Key 可以在 Google Cloud Console 配置 HTTP Referer 白名单
- 可以设置每日配额上限，防止被滥用
- Demo 使用的是个人免费配额，损失有限

但在生产环境中这绝对不可行。正确做法：前端 → Cloudflare Worker / Vercel Edge Function（附加 API Key + 限流鉴权）→ Gemini API，密钥只存在于服务端环境变量。Supabase 的 anon key 则不存在这个问题——它的安全性由 RLS 策略保证，即使 key 暴露，未认证用户也无法读写任何数据。

---

## 三、当前完成程度

### ✅ 已完成

| 模块 | 功能 | 实现细节 |
|------|------|---------|
| Landing Page | 暗色主题着陆页 | Hero 区域带中央输入框、5 个 Agent 角色展示卡片（头像+品牌色+职能描述）、功能特性卡片网格、CTA 按钮跳转到 Dashboard |
| 认证系统 | Google OAuth 登录 | Supabase Auth 完整集成，`useAuth` hook 管理认证状态，Login 页面支持 OAuth 跳转；附带 Demo 模式 fallback——未配置 Google 凭证时可跳过登录直接体验 |
| Dashboard | 项目管理 | 卡片式项目列表，支持创建新项目、删除项目、点击跳转到 Workspace；空状态引导 UI |
| Workspace 布局 | 三栏可拖拽 | Chat（左 30%）/ Editor（中 35%）/ Preview（右 35%），`useDraggablePanel` Hook 实现拖拽，15%~50% 范围限制，1px 拖拽手柄 hover 高亮 |
| Agent 对话 | Gemini 2.5 Pro 流式输出 | Engineer 模式下与 Alex Agent 对话，`streamGenerateCode` 逐 chunk 更新消息气泡，流式光标动画（`animate-pulse` 蓝色竖线），消息列表自动滚底 |
| 消息渲染 | 简易 Markdown | `renderMarkdown` 函数处理代码块（深色背景 + 语言标签）和行内 code（紫色高亮），Agent 头像（emoji + 半透明品牌色圆形背景）+ 时间戳 |
| 代码预览 | iframe srcdoc 实时渲染 | 自动从 AI 响应提取 HTML 并渲染，Desktop/Mobile 视口切换（375px mobile 宽度 + 圆角阴影），macOS 三色点标题栏 + 仿浏览器 URL 栏，刷新/全屏按钮 |
| 代码编辑器 | Monaco Editor | `@monaco-editor/react` 集成，vs-dark 主题，多文件 Tab 切换，语法高亮，编辑内容实时同步到 Preview（通过 `buildPreviewHtml` 拼接 CSS/JS） |
| 文件管理 | 文件树面板 | 新建文件（输入文件名）、删除文件（确认对话框）、按扩展名显示图标（HTML/CSS/JS 等）、点击切换活跃文件高亮 |
| Team 模式 | 5 Agent 流水线 | `teamOrchestrator.ts` 串行执行 Emma → Bob → Alex → Luna → Sarah，`previousOutput` 链式传递上下文，`TeamPipeline` 组件以时间线 UI 展示进度（竖线连接 + 状态图标：✓/spinner/⚠/clock），实时展示当前 Agent 的流式输出 |
| Race 模式 | 3 路并行生成 | `raceRunner.ts` 用 `Promise.allSettled` 并行 3 路 `streamGenerateCode`，`RaceView` 网格布局对比预览（每张卡片含 iframe + 三色点标题栏 + Expand/Select 按钮），选择后代码写入 files 并切回 Engineer 模式 |
| HTML 提取 | 三级 fallback 策略 | `extractHtmlFromResponse`：markdown fence → DOCTYPE/html 开头检测 → 正则捕获完整文档 |
| 数据库 Schema | Supabase SQL 脚本 | `supabase-schema.sql` 包含 projects/conversations/versions 三表建表语句、JSONB 字段定义、RLS 策略（`auth.uid() = user_id`）、索引、`updated_at` 自动更新触发器 |
| 服务层 | Supabase CRUD | `supabase.ts` 提供 8 个函数：Projects（get/getById/create/update/delete）、Conversations（get/add）、Versions（get/create），TypeScript 类型严格匹配 |
| GitHub 集成 | Git Data API 原子化推送 | `github.ts` 实现 create repo + atomic push（get ref → get commit → create tree → create commit → update ref），5 步 API 调用保证原子性 |
| CI/CD | Cloudflare Pages 部署 | `.github/workflows` 配置就绪，push to main 自动构建部署 |
| 文档 | 完整文档体系 | PRODUCT.md（产品文档）、TECHNICAL.md（技术文档）、DEPLOY.md（部署指南）、双语 README（中英文 + 语言切换链接）、`.env.example` 模板 |
| 工程化 | TypeScript + ESLint + Tailwind | 严格类型检查（`tsc -b`）、ESLint 规则配置（react-hooks/react-refresh 插件）、Tailwind CSS 4 原子化样式、Zustand 5 全局状态 |

### 🚧 未完成 / 部分完成

| 模块 | 当前状态 | 差距说明 |
|------|---------|---------|
| Supabase 实际接入 | Schema + 服务层代码就绪，Workspace 使用 `MOCK_MESSAGES` / `MOCK_TEAM_STEPS` / `MOCK_RACE_ENTRIES` mock 数据 | 需填入 `.env.local` 变量 + 执行 SQL 建表 + 将 mock 替换为 `useProject`/`useChat` hook 调用 |
| Google OAuth 真实流程 | `useAuth` hook 和 Login 页面代码就绪 | 需在 Google Cloud Console 创建 OAuth Client ID，在 Supabase Dashboard 启用 Google Provider 并配置回调 URL |
| GitHub 集成 UI | `github.ts` 服务层完整（createRepo + pushToGithub） | Workspace 的 Publish 按钮存在但未接线到 `github.ts`，需增加 modal 输入 Token/仓库名 |
| 对话持久化 | conversations 表 + CRUD 函数就绪 | 需在 ChatPanel 发送/接收消息时调用 `addConversation()`，Workspace 初始化时调用 `getConversations()` |
| 版本管理 | versions 表 + CRUD 函数就绪 | 需在代码生成后自动调用 `createVersion()`，UI 上增加版本时间线列表 + 回滚按钮 |
| 导出 ZIP | 未实现 | 计划使用 JSZip 将 `files` 对象打包为 .zip 下载 |
| 主题切换 | 仅暗色主题，样式硬编码在组件 inline style 中 | 需设计亮色 token 体系，增加 toggle 组件，将颜色值抽取为 CSS 变量 |
| 移动端适配 | 三栏布局在窄屏不可用 | 需将三栏折叠为底部 Tab 切换模式，或采用抽屉式侧滑布局 |

---

## 四、如果继续投入时间的扩展计划

### P0 — 核心闭环（2-3h）

| 任务 | 时间估算 | 具体操作 |
|------|---------|---------|
| 接入真实 Supabase | 30min | 填入 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 到 `.env.local`，在 Supabase SQL Editor 执行 `supabase-schema.sql`，将 Workspace 中的 `MOCK_*` 常量替换为 `useProject` / `useChat` hook 调用 |
| Google OAuth 真实配置 | 30min | Google Cloud Console 创建 OAuth 2.0 Client → Supabase Dashboard 启用 Google Provider → 配置 `https://your-project.supabase.co/auth/v1/callback` 回调 URL |
| Dashboard 数据拉取 | 1h | Dashboard 页面改为调用 `getProjects(userId)` 拉取真实项目列表，创建/删除走 `createProject()` / `deleteProject()` 的 Supabase 调用 |
| Demo 模式优化 | 30min | 未登录用户进入 Workspace 时用 `localStorage` 临时存储文件和对话，登录后自动迁移到 Supabase |

### P1 — 体验完善（3-4h）

| 任务 | 时间估算 | 具体操作 |
|------|---------|---------|
| 对话历史持久化 | 1h | 每条消息发送/接收时调用 `addConversation()`，Workspace 初始化通过 `getConversations(projectId)` 恢复历史消息列表 |
| 版本快照功能 | 1.5h | 每次 AI 生成代码后自动调用 `createVersion()`，在 Editor 侧边栏增加版本时间线（版本号 + 时间戳），点击可回滚到任意历史版本 |
| GitHub 集成 UI | 1.5h | Publish 按钮点击弹出 modal → 选择"创建新仓库"或"推送到已有仓库" → 输入 GitHub Token → 调用 `pushToGithub()` → 展示 commit URL 和仓库链接 |

### P2 — 功能增强（4-6h）

| 任务 | 时间估算 | 具体操作 |
|------|---------|---------|
| WebContainer 集成 | 3h | 引入 `@webcontainer/api`，Preview 组件检测生成代码是否包含 `import`/`require`：如有则启动 WebContainer 运行时（npm install + dev server），如无则保持当前 iframe srcdoc 模式。两种模式共存，自动切换 |
| 多模型切换 | 2h | 抽象 `LLMProvider` 接口（`generate` / `streamGenerate` / `generateWithRole`），Gemini/Claude/GPT 各实现一个适配器，Workspace 工具栏增加模型选择下拉框。Claude 和 GPT 需通过 Cloudflare Worker 代理中转 |
| Race 模式跨模型对比 | 1h | Race 的 3 路分别使用不同模型实例（如 Gemini vs Claude vs GPT），让用户直观对比不同模型在同一 prompt 下的代码生成质量和风格差异 |

### P3 — 未来方向

| 任务 | 时间估算 | 说明 |
|------|---------|------|
| Supabase Realtime 多人协作 | 1-2 周 | 使用 Supabase Realtime 的 Presence（在线状态感知）和 Broadcast（实时消息广播）功能，实现多人同时编辑同一项目，光标位置和文件变更实时同步 |
| AI Agent 自定义 | 1 周 | 用户自定义 Agent 角色：名称、头像、system prompt、在流水线中的位置和顺序。支持保存为模板并在 Dashboard 中复用 |
| 模板市场 / App World | 2-3 周 | 用户将生成的应用发布为公开模板，其他用户一键 fork 并在此基础上用 Agent 迭代。形成"AI 生成 → 分享 → 再生成"的内容飞轮 |
| Stripe 支付集成 | 1 周 | 免费层每日 N 次生成 + Pro 订阅解锁无限次数 / 高级模型 / 更大文件存储。Race 模式消耗 3x 配额，Team 模式消耗 5x 配额 |

---

## 五、开发方式说明

本项目使用 **Claude Code** 作为主要开发工具，采用 **"Agent Team" 并行开发模式**，整个项目从零到 `tsc -b && vite build` 构建成功约 **30 分钟**。

### 开发流程

```
Phase 1 — 主 Agent 独立工作
├── 架构设计：确定技术栈、目录结构、模块边界
├── 项目初始化：Vite + React 19 + TypeScript + Tailwind 4 脚手架
├── 核心类型定义：types/index.ts（Project, AgentConfig, TeamStep, RaceEntry, ChatMessage 等）
└── 接口契约：定义各模块的函数签名和数据流向，作为 Sub-Agent 的并行依据

Phase 2 — 3 个 Sub-Agent 并行开发（核心模块）
├── Sub-Agent A：服务层
│   └── gemini.ts / supabase.ts / github.ts / supabaseClient.ts
├── Sub-Agent B：页面 UI
│   └── Landing.tsx / Login.tsx / Dashboard.tsx + 各子组件
└── Sub-Agent C：Workspace 核心
    └── Workspace.tsx / ChatPanel.tsx / CodeEditor.tsx / FileTree.tsx
        Preview.tsx / TeamPipeline.tsx / RaceView.tsx

Phase 3 — 主 Agent 整合
├── 模块集成：服务层接入 Workspace，Agent 编排连通 UI
├── 模式切换：Engineer / Team / Race 三模式路由逻辑
└── 状态管理：Zustand Store 串联全局状态

Phase 4 — 4 个 Sub-Agent 并行收尾
├── Sub-Agent D：文档（PRODUCT.md, TECHNICAL.md, 双语 README）
├── Sub-Agent E：Supabase 配置（Schema SQL, RLS 策略, .env.example）
├── Sub-Agent F：API 整合（Agent prompts 精调, 流式回调优化, 错误处理）
└── Sub-Agent G：部署配置（Cloudflare Pages CI/CD, GitHub Actions, wrangler.toml）

Phase 5 — 主 Agent 最终验证
├── tsc -b 类型检查通过（零 error）
├── vite build 构建成功
└── 文档审查与一致性校验
```

### 关键数据

- **总计调用 7 个 Sub-Agent**，分两批并行执行，显著提升开发效率
- Sub-Agent 之间通过预定义的 TypeScript 接口（`types/index.ts`）解耦，最大化并行度
- 主 Agent 负责架构决策和最终整合，Sub-Agent 负责具体实现，分工边界清晰
- 整个过程本身就是 AtomForge "Team Mode" 设计理念的一次实践——把软件开发的完整工作流压缩到一次对话中，只不过这里的 Agent 是 Claude Code 的 Sub-Agent 而非 Gemini 的角色扮演
