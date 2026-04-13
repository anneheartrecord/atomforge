# AtomForge 技术文档

## 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐ │
│  │  Pages    │  │Components │  │  Hooks   │  │ Store  │ │
│  │ Landing   │  │ Workspace │  │ useChat  │  │Zustand │ │
│  │ Login     │  │ Dashboard │  │ useAuth  │  │        │ │
│  │ Dashboard │  │ Auth      │  │useProject│  │        │ │
│  │ Workspace │  │ Layout    │  │useTeam   │  │        │ │
│  └──────────┘  └───────────┘  └──────────┘  └────────┘ │
│         │              │              │            │      │
│         └──────────────┴──────────────┴────────────┘      │
│                          │                                │
│              ┌───────────┴───────────┐                    │
│              │      Services         │                    │
│              │  gemini.ts            │                    │
│              │  supabase.ts          │                    │
│              │  github.ts            │                    │
│              └───────────┬───────────┘                    │
│                          │                                │
│              ┌───────────┴───────────┐                    │
│              │      Agents           │                    │
│              │  prompts.ts           │                    │
│              │  teamOrchestrator.ts  │                    │
│              │  raceRunner.ts        │                    │
│              └───────────────────────┘                    │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
  ┌──────────────┐ ┌─────────────┐ ┌─────────────┐
  │Google Gemini │ │  Supabase   │ │  GitHub API │
  │  2.5 Pro     │ │ Auth + DB   │ │  Git Data   │
  └──────────────┘ └─────────────┘ └─────────────┘
```

## 目录结构

```
atomforge/
├── public/                  # 静态资源
│   └── vite.svg
├── src/
│   ├── agents/              # AI Agent 编排层
│   │   ├── prompts.ts       # 5 个 Agent 的 System Prompt 定义
│   │   ├── raceRunner.ts    # Race 模式：并行生成引擎
│   │   ├── teamOrchestrator.ts  # Team 模式：流水线编排器
│   │   └── types.ts         # Agent 配置常量（名称、颜色、头像）
│   ├── assets/              # 图片资源
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── components/          # UI 组件
│   │   ├── auth/            # 认证相关组件
│   │   ├── dashboard/       # 仪表盘组件
│   │   ├── landing/         # 着陆页组件
│   │   ├── layout/          # 布局组件
│   │   ├── race/            # Race 模式组件
│   │   ├── team/            # Team 模式组件
│   │   └── workspace/       # 工作区组件
│   ├── hooks/               # 自定义 React Hooks
│   │   ├── useAuth.ts       # 认证状态管理
│   │   ├── useChat.ts       # 对话逻辑（发送消息、流式响应）
│   │   ├── useProject.ts    # 项目 CRUD 操作
│   │   └── useTeamMode.ts   # Team 模式流水线控制
│   ├── lib/                 # 基础库初始化
│   │   └── supabaseClient.ts  # Supabase 客户端实例
│   ├── pages/               # 页面组件
│   │   ├── Dashboard.tsx    # 项目列表页
│   │   ├── Landing.tsx      # 首页/着陆页
│   │   ├── Login.tsx        # 登录页
│   │   └── Workspace.tsx    # 工作区主页面
│   ├── services/            # 外部服务接口
│   │   ├── gemini.ts        # Gemini API 封装
│   │   ├── github.ts        # GitHub API 封装
│   │   └── supabase.ts      # Supabase 数据操作
│   ├── store/               # 全局状态
│   │   └── index.ts         # Zustand Store
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx              # 根组件（路由配置）
│   ├── index.css            # 全局样式（Tailwind 入口）
│   └── main.tsx             # 应用入口
├── docs/                    # 文档目录
├── .env.example             # 环境变量模板
├── .github/                 # GitHub 配置
├── index.html               # HTML 入口
├── package.json
├── supabase-schema.sql      # 数据库建表脚本
├── tailwind.config.*        # Tailwind 配置
├── tsconfig.json            # TypeScript 配置
└── vite.config.ts           # Vite 配置
```

## 各模块技术详解

### 1. Gemini API 集成（`src/services/gemini.ts`）

使用 `@google/generative-ai` SDK 接入 Google Gemini 2.5 Pro 模型。

#### 三个核心函数

| 函数 | 用途 | 流式 |
|------|------|------|
| `generateCode()` | 单次代码生成 | ❌ |
| `streamGenerateCode()` | 流式代码生成（Engineer 模式） | ✅ |
| `generateWithRole()` | 带自定义 System Prompt 的生成（Team 模式） | ✅/❌ |

#### 实现要点

- **模型**：`gemini-2.5-pro-preview-05-06`
- **System Prompt**：要求模型输出自包含的 HTML 文件，所有 CSS/JS 内联，不使用 markdown 代码围栏
- **流式生成**：通过 `generateContentStream()` 获取 AsyncIterator，逐 chunk 回调
- **上下文传递**：支持传入 `context` 参数，将前序 Agent 的输出拼接到 prompt 中

```typescript
// 流式生成核心逻辑
const result = await model.generateContentStream(prompt);
let fullText = '';
for await (const chunk of result.stream) {
  const chunkText = chunk.text();
  fullText += chunkText;
  onChunk(chunkText);  // 实时回调
}
```

### 2. Supabase 数据层（`src/lib/supabaseClient.ts` + `src/services/supabase.ts`）

#### 客户端初始化

```typescript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

#### 数据库 Schema

三张核心表，全部启用 RLS：

**projects 表**
- `id`: UUID 主键
- `user_id`: 关联 `auth.users`，级联删除
- `files`: JSONB，存储文件名到内容的映射（`Record<string, string>`）
- `preview_html`: 最新预览 HTML
- `mode`: 枚举 `engineer | team | race`
- `status`: 枚举 `active | archived`

**conversations 表**
- `project_id`: 外键关联 projects
- `role`: 消息角色（`user | assistant | emma | bob | alex | luna | sarah`）
- `content`: 消息内容
- `metadata`: JSONB 扩展字段

**versions 表**
- `project_id`: 外键关联 projects
- `version_number`: 自增版本号
- `files`: JSONB 文件快照
- `preview_html`: 该版本的预览 HTML

#### RLS 策略

所有表都通过 `auth.uid() = user_id` 实现行级安全，确保用户只能访问自己的数据。conversations 和 versions 表通过子查询关联到 projects 表的 user_id。

### 3. Agent 编排

#### Team 模式编排器（`src/agents/teamOrchestrator.ts`）

流水线顺序固定为：`Emma → Bob → Alex → Luna → Sarah`

```typescript
const PIPELINE_ORDER: AgentRole[] = ['emma', 'bob', 'alex', 'luna', 'sarah'];
```

核心逻辑：
1. 初始化 5 个步骤，状态均为 `pending`
2. 按顺序执行每个 Agent
3. 第一步接收用户原始 prompt
4. 后续步骤接收原始 prompt + 前一步的输出
5. 每一步支持流式回调，实时报告进度
6. 任一步骤出错则终止流水线

#### Race 模式运行器（`src/agents/raceRunner.ts`）

使用 `Promise.allSettled()` 并行执行多个流式生成任务：

```typescript
const tasks = entries.map(async (_, index) => {
  // 每个 entry 独立调用 streamGenerateCode
  const fullText = await streamGenerateCode(prompt, (chunk) => {
    entries[index].output += chunk;
    onUpdate([...entries]);  // 实时更新
  });
});
await Promise.allSettled(tasks);
```

### 4. 代码预览

生成的代码通过 iframe 的 `srcdoc` 属性实时渲染：

```html
<iframe srcdoc={generatedHtml} sandbox="allow-scripts" />
```

由于生成的是自包含 HTML，无需额外的 bundler 或运行时，直接在 iframe 沙箱中执行。

### 5. GitHub 集成（`src/services/github.ts`）

使用 GitHub Git Data API 实现代码推送，流程：

```
1. GET  /repos/{repo}/git/ref/heads/main     → 获取最新 commit SHA
2. GET  /repos/{repo}/git/commits/{sha}       → 获取 tree SHA
3. POST /repos/{repo}/git/trees               → 创建新 tree（包含文件）
4. POST /repos/{repo}/git/commits             → 创建新 commit
5. PATCH /repos/{repo}/git/refs/heads/main    → 更新分支指针
```

### 6. 状态管理（`src/store/index.ts`）

使用 Zustand 管理全局状态，主要包括：
- 当前用户信息
- 当前项目
- 对话消息列表
- 工作模式
- 各 Agent 步骤状态

## API 说明

### Gemini API

| 接口 | 方法 | 说明 |
|------|------|------|
| `generateCode(prompt, context?)` | 异步 | 一次性生成完整代码 |
| `streamGenerateCode(prompt, onChunk, context?)` | 异步流式 | 流式生成，逐 chunk 回调 |
| `generateWithRole(systemPrompt, userPrompt, onChunk?)` | 异步 | 自定义角色的生成（Team 模式） |

### Supabase 数据操作

| 操作 | 表 | 说明 |
|------|---|------|
| 创建项目 | projects | INSERT，返回项目 ID |
| 读取项目列表 | projects | SELECT，按 user_id 过滤 |
| 更新项目 | projects | UPDATE，更新 files/preview_html |
| 保存对话 | conversations | INSERT，关联 project_id |
| 读取对话历史 | conversations | SELECT，按 project_id 过滤 |
| 保存版本快照 | versions | INSERT，记录当前文件状态 |

### GitHub API

| 操作 | 说明 |
|------|------|
| `createRepo(token, name, description)` | 创建新仓库，返回仓库 URL |
| `pushToGithub(token, repo, files)` | 推送文件到仓库，返回 commit URL |

## 部署指南

### 静态部署（推荐）

AtomForge 是纯前端应用，构建产物为静态文件，可部署到任何静态托管平台。

#### Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

在 Vercel 项目设置中配置环境变量：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`

#### Netlify

```bash
npm run build
# 上传 dist/ 目录到 Netlify
```

#### 手动部署

```bash
npm run build
# 将 dist/ 目录部署到任何支持静态文件的 Web 服务器
```

## 本地开发指南

### 前置条件

- Node.js >= 18
- npm >= 9
- 一个 Supabase 项目
- 一个 Google Gemini API Key

### 1. 克隆并安装依赖

```bash
git clone <repo-url>
cd atomforge
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填入实际值：

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 3. 初始化 Supabase 数据库

在 Supabase Dashboard 的 SQL Editor 中执行 `supabase-schema.sql`：

```bash
# 或者使用 Supabase CLI
supabase db reset
```

该脚本会创建：
- `projects`、`conversations`、`versions` 三张表
- 必要的索引
- RLS 策略
- `updated_at` 自动更新触发器

### 4. 启动开发服务器

```bash
npm run dev
```

默认运行在 `http://localhost:5173`。

### 5. 构建生产版本

```bash
npm run build
npm run preview  # 本地预览生产构建
```

### 开发注意事项

- **Gemini API 配额**：开发阶段注意控制请求频率，Race 模式会并行发送多个请求
- **Supabase RLS**：确保本地测试时已登录，否则 RLS 策略会拒绝所有数据操作
- **CORS**：Gemini API 和 GitHub API 均支持浏览器直接调用，无需后端代理
- **iframe 安全**：预览 iframe 使用 `sandbox` 属性限制权限，防止生成的代码访问主页面
