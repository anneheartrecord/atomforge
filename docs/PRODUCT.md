# AtomForge 产品文档

## 产品简介

AtomForge 是一个 AI Agent 驱动的代码生成平台，灵感来源于 [Atoms.dev](https://atoms.dev)。用户通过自然语言描述需求，由多个专业 AI Agent 协作完成从产品设计、架构规划、代码实现、质量审查到性能优化的全流程，最终生成可直接运行的前端应用代码。

AtomForge 的核心理念是：**把软件开发的完整工作流压缩到一次对话中**。用户只需要说清楚"想要什么"，剩下的交给 AI Agent 团队。

## 核心功能

### 1. Agent 对话

用户在工作区中与 AI Agent 进行自然语言对话，描述想要构建的应用。Agent 理解需求后，直接生成完整的、可运行的 HTML/CSS/JS 代码。支持流式输出，生成过程实时可见。

### 2. 代码生成

基于 Google Gemini 2.5 Pro 模型，生成自包含的单文件 HTML 应用。所有 CSS 内联在 `<style>` 标签中，所有 JavaScript 内联在 `<script>` 标签中，生成即可运行，无需额外构建步骤。

### 3. 实时预览

代码生成完成后，右侧面板通过 iframe `srcdoc` 实时渲染预览。用户可以即时看到生成效果，并通过继续对话迭代优化。

### 4. 团队模式（Team Mode）

5 个 AI Agent 按流水线顺序协作：产品经理出 PRD → 架构师设计方案 → 工程师写代码 → QA 审查 → SEO 专家优化。每一步的输出自动传递给下一步作为上下文。

### 5. 赛马模式（Race Mode）

同一个 prompt 并行发送给多个 Gemini 实例，各自独立生成代码。用户可以对比不同生成结果，选择最满意的方案。所有实例流式输出，进度实时可见。

### 6. GitHub 集成

一键将生成的代码推送到 GitHub 仓库。支持创建新仓库和推送到已有仓库，使用 Git Data API（create tree → create commit → update ref）实现。

## AI Agent 角色

AtomForge 内置 5 个专业 AI Agent，各司其职：

### 👩‍💼 Emma — 产品经理

- **职责**：分析用户需求，输出结构化的 PRD（产品需求文档）
- **输出内容**：产品概述、目标用户、核心功能列表（含优先级）、用户流程、UI/UX 要求、成功指标、约束条件
- **在流水线中的位置**：第 1 步

### 🏗️ Bob — 软件架构师

- **职责**：基于 PRD 设计技术架构
- **输出内容**：技术栈选型、组件结构、数据模型、页面布局蓝图、样式策略（配色、字体、间距）、文件结构规划
- **在流水线中的位置**：第 2 步

### 👨‍💻 Alex — 前端工程师

- **职责**：根据架构文档实现完整代码
- **输出内容**：自包含的 HTML 文件，包含完整的 CSS 和 JavaScript，可直接在浏览器中运行
- **技术要求**：CSS 自定义属性、Flexbox/Grid 布局、响应式设计、平滑动画、完善的错误处理
- **在流水线中的位置**：第 3 步

### 🔍 Luna — QA 工程师

- **职责**：对生成的代码进行全面审查
- **输出内容**：代码审查报告，涵盖 Bug 检测、无障碍性、性能问题、安全隐患、代码质量评估、改进建议
- **在流水线中的位置**：第 4 步

### 📊 Sarah — SEO 与性能专家

- **职责**：分析代码的 SEO 和 Web 性能
- **输出内容**：Meta 标签分析、语义化 HTML 评估、性能评分、Core Web Vitals 预测、可操作的优化建议
- **在流水线中的位置**：第 5 步

## 三种工作模式

### Engineer 模式（默认）

单 Agent 模式。用户直接与 AI 对话，AI 扮演全栈工程师角色，一步到位生成代码。适合快速原型和简单需求。

### Team 模式

5 Agent 流水线协作：

```
用户需求 → Emma(PRD) → Bob(架构) → Alex(代码) → Luna(审查) → Sarah(优化)
```

每个 Agent 的输出自动作为下一个 Agent 的输入上下文。用户可以实时看到每个 Agent 的工作进度和输出内容。适合复杂应用开发，生成质量更高。

### Race 模式

同一个 prompt 并行生成多份代码（默认 3 份）。所有生成任务同时启动，各自独立运行。用户可以实时对比不同方案的生成过程和最终结果，选择最优方案。适合需要多样性选择的场景。

## 用户使用流程

```
1. 注册/登录（Supabase Auth）
2. 进入 Dashboard，创建新项目或打开已有项目
3. 选择工作模式（Engineer / Team / Race）
4. 在对话框中输入需求描述
5. AI Agent 开始工作，实时查看生成过程
6. 右侧预览面板实时渲染生成结果
7. 继续对话迭代优化，或切换模式重新生成
8. 满意后一键推送到 GitHub
```

## 数据持久化

AtomForge 使用 Supabase 作为后端服务，提供以下能力：

### 数据表

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `projects` | 项目信息 | name, files(jsonb), preview_html, mode, status |
| `conversations` | 对话记录 | project_id, role, content, metadata(jsonb) |
| `versions` | 版本快照 | project_id, version_number, files(jsonb), preview_html |

### 安全策略

- 启用 Row Level Security (RLS)
- 用户只能访问自己的数据
- 所有表都配置了基于 `auth.uid()` 的访问策略

### 认证

- 使用 Supabase Auth
- 支持邮箱密码登录

## 部署信息

- **前端构建**：`npm run build`（Vite 输出到 `dist/` 目录）
- **部署目标**：可部署到 Vercel、Netlify、Cloudflare Pages 等静态托管平台
- **环境变量**：
  - `VITE_SUPABASE_URL` — Supabase 项目 URL
  - `VITE_SUPABASE_ANON_KEY` — Supabase 匿名密钥
  - `VITE_GEMINI_API_KEY` — Google Gemini API 密钥
