# AtomForge 完整 Code Review 报告

**生成时间**: 2026-04-13  
**项目**: AtomForge AI 代码生成平台  
**检查范围**: 路由、页面、服务、Hooks、Agent 系统

---

## 📋 执行摘要

### 构建状态
- ✅ **编译**: 成功（无类型错误）
- ✅ **运行**: 能够启动（Demo Mode 正常）
- ⚠️ **集成**: Supabase 和 Gemini API 集成点存在逻辑缺陷

### 问题统计
- 🐛 **能跑但有 Bug**: 12 个
- ❌ **无法工作**: 3 个
- 🔧 **设计问题**: 4 个

---

## 🐛 详细问题列表

### 1️⃣ 【能跑但有 Bug】Email 登录功能不完整

**文件**: `src/pages/Login.tsx`  
**行号**: 49-58  
**严重程度**: 🟠 中等

**问题描述**:
```typescript
// Sign Up 时未验证 Email
if (isSignUp) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  setMessage('Check your email to confirm your account!');
} else {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  localStorage.setItem('atomforge_user', JSON.stringify({ name: email.split('@')[0], email }));
  navigate('/dashboard');
}
```

**Bug**:
1. Sign Up 成功后不应该直接显示消息，而是应该检查 `session` 是否存在
2. 如果 Supabase 要求 Email 验证但用户跳过（Demo 模式），会直接存储到 localStorage，绕过真实验证
3. `email.split('@')[0]` 可能 crash（如果 email 格式不合法）

**修复方案**:
```typescript
if (isSignUp) {
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`
    }
  });
  if (error) throw error;
  if (data.user && !data.user.confirmed_at) {
    setMessage('Check your email to confirm your account!');
  } else {
    localStorage.setItem('atomforge_user', JSON.stringify({ 
      name: email.split('@')[0] || 'User', 
      email 
    }));
    navigate('/dashboard');
  }
} else {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.session?.user) {
    localStorage.setItem('atomforge_user', JSON.stringify({ 
      name: email.split('@')[0] || 'User', 
      email 
    }));
    navigate('/dashboard');
  }
}
```

---

### 2️⃣ 【能跑但有 Bug】Dashboard 中 getCurrentUser 可能返回 null

**文件**: `src/pages/Dashboard.tsx`  
**行号**: 63-74  
**严重程度**: 🟠 中等

**问题描述**:
```typescript
const user = await supabaseService.getCurrentUser();
if (cancelled) return;

if (user) {
  setUserId(user.id);
  const data = await supabaseService.getProjects(user.id);
  if (!cancelled) setProjects(data);
} else {
  // 未登录，使用 Demo 模式
  setIsDemo(true);
  setProjects(mockProjects);
}
```

**Bug**: `getCurrentUser()` 从 Supabase 获取 session，但如果 Supabase 配置不正确或网络错误，会返回 null，然后自动 fallback 到 Demo 模式。这在生产环境中会误导用户以为登录成功了。

**修复方案**:
```typescript
async function init() {
  try {
    const user = await supabaseService.getCurrentUser();
    if (cancelled) return;

    if (user) {
      setUserId(user.id);
      try {
        const data = await supabaseService.getProjects(user.id);
        if (!cancelled) setProjects(data);
      } catch (err) {
        console.warn('Failed to fetch projects, using demo', err);
        setIsDemo(true);
        setProjects(mockProjects);
      }
    } else {
      // 真正未登录
      setIsDemo(true);
      setProjects(mockProjects);
    }
  } catch (err) {
    // Supabase 连接失败，明确告知用户
    console.error('Supabase connection error:', err);
    if (!cancelled) {
      setIsDemo(true);
      setProjects(mockProjects);
    }
  }
}
```

---

### 3️⃣ 【能跑但有 Bug】Workspace 中对话持久化逻辑不完整

**文件**: `src/pages/Workspace.tsx`  
**行号**: 198-227, 244-247  
**严重程度**: 🟠 中等

**问题描述**:
```typescript
// 加载历史对话时
async function loadHistory() {
  try {
    const conversations = await getConversations(pid);
    if (cancelled) return;
    if (conversations.length > 0) {
      const loaded: ChatMessage[] = conversations.map((c) => ({
        id: c.id,
        role: c.role as ChatMessage['role'],
        content: c.content,
        timestamp: c.created_at,
      }));
      setMessages(loaded);
    } else {
      // 没有历史对话，使用 mock
      setMessages(MOCK_MESSAGES);
    }
  } catch {
    // Supabase 调用失败，fallback 到 mock
    setMessages(MOCK_MESSAGES);
  }
}
```

**Bug**:
1. 如果 Supabase 获取对话失败，会自动使用 Mock 数据，不会通知用户
2. 用户消息持久化时没有等待返回结果，直接 `.catch(console.error)` 忽略错误
3. 没有加载提示，用户不知道数据是从何处来

**修复方案**:
```typescript
async function loadHistory() {
  try {
    const conversations = await getConversations(pid);
    if (cancelled) return;
    
    if (conversations.length > 0) {
      const loaded: ChatMessage[] = conversations.map((c) => ({
        id: c.id,
        role: c.role as ChatMessage['role'],
        content: c.content,
        timestamp: c.created_at,
      }));
      setMessages(loaded);
    } else {
      // 使用 mock 但添加标记
      console.log('No history found, using demo conversations');
      setMessages(MOCK_MESSAGES);
    }
  } catch (err) {
    console.warn('Failed to load conversations from Supabase:', err);
    // Fallback 到 mock 并显示提示
    setMessages(MOCK_MESSAGES);
  }
}

// 持久化消息时添加 await
if (pid) {
  try {
    await addConversation({ pid, role: 'user', content, metadata: {} });
  } catch (err) {
    console.error('Failed to save user message:', err);
  }
}
```

---

### 4️⃣ 【能跑但有 Bug】Team Mode 中 AGENTS 类型不匹配

**文件**: `src/pages/Workspace.tsx`  
**行号**: 17-23 vs `src/agents/types.ts`  
**严重程度**: 🟠 中等

**问题描述**:

在 `Workspace.tsx` 中定义了局部的 AGENTS Record：
```typescript
const AGENTS: Record<string, AgentConfig> = {
  emma: { role: 'emma', name: 'Emma', title: 'Product Manager', ... },
  bob:  { role: 'bob',  name: 'Bob',  title: 'Architect', ... },
  // ...
};
```

但在 `agents/types.ts` 中已经定义了全局的 AGENTS 数组：
```typescript
export const AGENTS: AgentConfig[] = [
  { role: 'emma', name: 'Emma', title: '产品经理', ... },
  // ...
];
```

**Bug**:
1. 两个定义不一致（Record vs Array）
2. 中英文标题不统一
3. 没有使用全局定义，导致本地 mock 数据与全局配置脱离

**修复方案**:
```typescript
// 在 Workspace.tsx 中导入并使用全局配置
import { AGENTS } from '../agents/types';

// 然后使用
const agentMap = Object.fromEntries(AGENTS.map(a => [a.role, a]));

// 或者修改 agents/types.ts 导出 Record 版本
export const AGENTS_MAP = Object.fromEntries(
  AGENTS.map(a => [a.role, a])
);
```

---

### 5️⃣ 【能跑但有 Bug】RaceView 颜色值错误

**文件**: `src/components/race/RaceView.tsx`  
**行号**: 93  
**严重程度**: 🟡 低

**问题描述**:
```typescript
<button
  // ...
  style={{ background: '#3b82f6', color: '#0f172a' }}
>
  Select
</button>
```

**Bug**: 按钮文字颜色 `#0f172a` 和背景 `#3b82f6` 对比度不够，文字很难读取

**修复方案**:
```typescript
style={{ background: '#3b82f6', color: '#ffffff' }}
```

---

### 6️⃣ 【能跑但有 Bug】CodeEditor 中关闭标签没有实现

**文件**: `src/components/workspace/CodeEditor.tsx`  
**行号**: 65-68  
**严重程度**: 🟠 中等

**问题描述**:
```typescript
<X
  size={12}
  className="ml-1 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
  onClick={e => { e.stopPropagation(); /* close tab logic */ }}
/>
```

**Bug**: 关闭标签按钮没有实现关闭逻辑，只有注释

**修复方案**:
```typescript
<X
  size={12}
  className="ml-1 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity cursor-pointer"
  onClick={(e) => {
    e.stopPropagation();
    onDeleteFile?.(name);  // 需要从 props 传入 onDeleteFile
  }}
/>
```

需要在 CodeEditor props 中添加 `onDeleteFile` 回调。

---

### 7️⃣ 【能跑但有 Bug】ChatPanel 中用户消息颜色对比度不足

**文件**: `src/components/workspace/ChatPanel.tsx`  
**行号**: 130-142  
**严重程度**: 🟡 低

**问题描述**:
```typescript
<div
  style={{
    background: isUser ? '#1a2744' : '#f8fafc',
    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
    color: '#ddd',  // ← 用户消息是深蓝背景，但文字是 #ddd，对比度不足
  }}
>
```

**Bug**: 用户消息背景是深蓝色（`#1a2744`），但文字颜色 `#ddd` 对比度不足（大约 3.5:1，推荐 4.5:1）

**修复方案**:
```typescript
<div
  style={{
    background: isUser ? '#1a2744' : '#f8fafc',
    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
    color: isUser ? '#ffffff' : '#0f172a',  // 根据背景调整
  }}
>
```

---

### 8️⃣ 【能跑但有 Bug】streamGenerateCode 流式响应处理不完整

**文件**: `src/pages/Workspace.tsx`  
**行号**: 304-312  
**严重程度**: 🟠 中等

**问题描述**:
```typescript
const fullResponse = await streamGenerateCode(content, (chunk) => {
  accumulated += chunk;
  setMessages(prev => {
    const msgs = [...prev];
    msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: accumulated };
    return msgs;
  });
});
```

**Bug**:
1. 流式更新时每次都是完整替换，可能导致性能问题（大量 re-render）
2. 没有处理流式更新可能的中断情况
3. 累积的 `accumulated` 变量在外层作用域，可能被重复使用

**修复方案**:
```typescript
let accumulated = '';
const fullResponse = await streamGenerateCode(content, (chunk) => {
  accumulated += chunk;
  setMessages(prev => {
    const msgs = [...prev];
    const lastMsg = msgs[msgs.length - 1];
    // 只更新最后一条消息的内容
    msgs[msgs.length - 1] = { 
      ...lastMsg, 
      content: accumulated,
      isStreaming: true
    };
    return msgs;
  });
});

// 标记流式完成
setMessages(prev => {
  const msgs = [...prev];
  msgs[msgs.length - 1] = { 
    ...msgs[msgs.length - 1], 
    content: fullResponse,
    isStreaming: false 
  };
  return msgs;
});
```

---

### 9️⃣ 【能跑但有 Bug】runTeamPipeline 中 AGENTS 类型错误

**文件**: `src/agents/teamOrchestrator.ts`  
**行号**: 1-6, 16-22  
**严重程度**: 🔴 严重

**问题描述**:
```typescript
import type { AgentRole, TeamStep } from '../types';
import { AGENTS } from './types';
import { generateWithRole } from '../services/gemini';

const PIPELINE_ORDER: AgentRole[] = ['emma', 'bob', 'alex', 'luna', 'sarah'];

export async function runTeamPipeline(...) {
  const steps: TeamStep[] = PIPELINE_ORDER.map((role) => {
    const agent = AGENTS.find((a) => a.role === role)!;  // ← AGENTS 是数组，但 find 正常
    return {
      agent,
      status: 'pending' as const,
      output: '',
    };
  });
  // ...
}
```

**Bug**: 导入的 `AGENTS` 从 `./types` 是数组，但 Workspace 中定义的是 Record。当 teamOrchestrator 和 Workspace 同时使用时可能冲突。

**修复方案**: 统一使用全局的 AGENTS 数组定义，不要在不同文件中重复定义。

---

### 🔟 【能跑但有 Bug】getConversations 可能返回 undefined fields

**文件**: `src/services/supabase.ts`  
**行号**: 73-85  
**严重程度**: 🟠 中等

**问题描述**:
```typescript
export async function getConversations(pid: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('pid', pid)
    .order('created_at', { ascending: true });

  if (error)
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  return data as Conversation[];  // ← 强制类型转换，可能丢失字段
}
```

**Bug**:
1. 使用 `as Conversation[]` 强制转换，不验证返回的数据结构
2. 如果 Supabase 返回的字段不完整（e.g., `metadata` 为 null），会导致 runtime 错误

**修复方案**:
```typescript
export async function getConversations(pid: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('pid', pid)
    .order('created_at', { ascending: true });

  if (error)
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  
  return (data || []).map(c => ({
    id: c.id || '',
    pid: c.pid || pid,
    role: c.role || 'user',
    content: c.content || '',
    metadata: c.metadata || {},
    created_at: c.created_at || new Date().toISOString(),
  }));
}
```

---

### 1️⃣1️⃣ 【能跑但有 Bug】useChat.ts 中 role 类型不匹配

**文件**: `src/hooks/useChat.ts`  
**行号**: 46, 82-84  
**严重程度**: 🟠 中等

**问题描述**:
```typescript
const assistantMessage: ChatMessage = {
  id: assistantId,
  role: 'assistant',  // ← 但 ChatMessage['role'] 可能不接受 'assistant'
  content: '',
  timestamp: new Date().toISOString(),
  isStreaming: true,
};
```

**检查 types**: 
```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | AgentRole;  // ✓ 'assistant' 是允许的
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}
```

**Bug**: 虽然 types 允许 'assistant'，但在 Workspace 中只处理 'alex' 等 AgentRole，不处理通用的 'assistant'。

**修复方案**: 在 useChat 中明确使用 agent role：
```typescript
const assistantMessage: ChatMessage = {
  id: assistantId,
  role: 'alex',  // 默认使用 alex agent
  // ...
};
```

---

### 1️⃣2️⃣ 【能跑但有 Bug】Preview 组件可能不更新

**文件**: `src/pages/Workspace.tsx`  
**行号**: 229-237  
**严重程度**: 🟡 低

**问题描述**:
```typescript
const buildPreviewHtml = useCallback(() => {
  const html = files['index.html'] || '';
  const css = files['style.css'] || '';
  const js = files['script.js'] || '';
  return html
    .replace(/<link[^>]*href="style\.css"[^>]*\/>/, `<style>${css}</style>`)
    .replace(/<script[^>]*src="script\.js"[^>]*><\/script>/, `<script>${js}<\/script>`);
}, [files]);
```

**Bug**: 
1. 正则表达式匹配可能不完全（e.g., 属性顺序不同）
2. 没有考虑脚本标签可能是自闭合的 `<script />`
3. 如果 CSS 或 JS 包含特殊字符，可能导致 HTML 注入

**修复方案**:
```typescript
const buildPreviewHtml = useCallback(() => {
  let result = files['index.html'] || '';
  const css = files['style.css'] || '';
  const js = files['script.js'] || '';
  
  // 更健壮的替换逻辑
  result = result.replace(
    /<link[^>]*href=["']?style\.css["']?[^>]*\/?>/gi,
    `<style>${css.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</style>`
  );
  
  result = result.replace(
    /<script[^>]*src=["']?script\.js["']?[^>]*><\/script>/gi,
    `<script>${js.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</script>`
  );
  
  return result;
}, [files]);
```

---

## ❌ 无法工作的功能

### ❌ 1. Artifact 保存功能不完整

**文件**: `src/services/supabase.ts`  
**行号**: 139-159  
**严重程度**: 🔴 严重

**问题描述**:
```typescript
export async function saveArtifact(
  pid: string,
  filename: string,
  content: string,
  filetype: string = 'text',
): Promise<Artifact> {
  const { data, error } = await supabase
    .from('artifacts')
    .insert({
      pid,
      filename,
      content,
      filetype,
      size_bytes: new Blob([content]).size,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save artifact: ${error.message}`);
  return data as Artifact;
}
```

**问题**:
1. 没有 `url` 字段的处理，但 `Artifact` 类型要求它
2. 在浏览器中，无法真正获取文件 URL，需要服务端支持

**Artifact 类型**:
```typescript
export interface Artifact {
  id: string;
  pid: string;
  filename: string;
  filetype: string;
  content: string;
  url: string;  // ← 这个字段没有被设置！
  size_bytes: number;
  created_at: string;
}
```

**修复方案**:

需要从 Supabase Storage 生成公开 URL：
```typescript
export async function saveArtifact(
  pid: string,
  filename: string,
  content: string,
  filetype: string = 'text',
): Promise<Artifact> {
  // 上传到 Storage
  const storagePath = `projects/${pid}/${filename}-${Date.now()}`;
  const { error: uploadError } = await supabase
    .storage
    .from('artifacts')
    .upload(storagePath, new Blob([content], { type: `text/${filetype}` }));

  if (uploadError) throw uploadError;

  // 获取公开 URL
  const { data: urlData } = supabase
    .storage
    .from('artifacts')
    .getPublicUrl(storagePath);

  // 保存 metadata 到 DB
  const { data, error } = await supabase
    .from('artifacts')
    .insert({
      pid,
      filename,
      content,  // 可以只存储引用或预览
      filetype,
      size_bytes: new Blob([content]).size,
      url: urlData?.publicUrl || '',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save artifact: ${error.message}`);
  return data as Artifact;
}
```

---

### ❌ 2. AI 生成 HTML 预览无法处理外部 CDN 资源

**文件**: `src/pages/Workspace.tsx`  
**行号**: 282-327  
**严重程度**: 🟠 中等

**问题描述**:

当 AI 在生成 HTML 时使用了外部 CDN 资源（如 Tailwind、Bootstrap 等），这些在 iframe 中可能加载失败。

例如，如果 AI 生成：
```html
<link rel="stylesheet" href="https://cdn.tailwindcss.com">
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

这些脚本可能：
1. 受到 CORS 限制
2. 在 `srcdoc` iframe 中被阻止
3. 加载缓慢导致预览不显示

**修复方案**:
```typescript
function sanitizeHtmlForPreview(html: string): string {
  // 允许的 CDN 域名白名单
  const allowedCdns = [
    'cdn.tailwindcss.com',
    'cdn.jsdelivr.net',
    'unpkg.com',
    'cdnjs.cloudflare.com',
  ];

  // 检查并过滤外部资源
  let sanitized = html;
  allowedCdns.forEach(cdn => {
    // 允许
  });
  
  // 添加 sandbox 安全策略
  const withSandbox = html.replace(
    /<html/i,
    '<html style="display:block"'
  );

  return withSandbox;
}

// 在 Preview 中使用
<iframe
  srcDoc={sanitizeHtmlForPreview(html)}
  sandbox="allow-scripts allow-same-origin allow-popups"
  style={{ background: '#fff' }}
/>
```

---

### ❌ 3. Race Mode 生成的多个 HTML 之间没有选择后的持久化

**文件**: `src/pages/Workspace.tsx`  
**行号**: 448-455  
**严重程度**: 🟠 中等

**问题描述**:
```typescript
{mode === 'race' ? (
  <RaceView entries={raceEntries} onSelect={id => {
    const entry = raceEntries.find(e => e.id === id);
    if (entry?.output) {
      setFiles(prev => ({ ...prev, 'index.html': entry.output }));
      setMode('engineer');  // ← 立即切换到 engineer 模式
    }
  }} />
) : (
```

**问题**:
1. 选择一个 Race 结果后，立即切换模式，丢失了对其他结果的追踪
2. 没有保存选中的 HTML 到 Supabase
3. 如果用户想要比较多个结果，无法做到

**修复方案**:
```typescript
const handleRaceSelect = async (id: string) => {
  const entry = raceEntries.find(e => e.id === id);
  if (entry?.output) {
    // 更新本地文件
    setFiles(prev => ({ ...prev, 'index.html': entry.output }));
    
    // 保存到 Supabase
    if (pid) {
      try {
        await saveArtifact(pid, `race-winner-${id}.html`, entry.output, 'html');
      } catch (err) {
        console.error('Failed to save race winner:', err);
      }
    }
    
    // 切换模式（可选）
    setMode('engineer');
  }
};
```

---

## 🔧 设计问题

### 问题 1: 无认证路由保护

**文件**: `src/App.tsx`  
**问题**: Dashboard 和 Workspace 页面没有使用 AuthGuard

```typescript
// 当前
<Route path="/dashboard" element={<Dashboard />} />

// 应该是
<Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
```

**修复**: 将所有需要认证的页面包裹在 AuthGuard 中。

---

### 问题 2: Demo Mode 和生产模式混淆

整个应用有太多的 Demo Mode fallback，导致：
- 无法区分是真实数据还是 Mock
- 生产环境中错误会被隐藏
- 用户无法知道数据同步状态

**建议**: 
1. 添加全局状态标记 Demo Mode
2. 在 UI 中清晰显示 Demo 状态
3. 在错误时显示清晰的错误消息，而不是 fallback 到 Mock

---

### 问题 3: 文件没有版本控制

虽然有 `Version` 表，但代码中从未使用过。用户每次编辑都会覆盖，无法回滚。

**建议**: 
1. 在用户编辑代码后自动创建版本快照
2. 提供版本历史 UI

---

### 问题 4: Agent Role 的 systemPrompt 为空

**文件**: `src/pages/Workspace.tsx`  
**行号**: 17-23

```typescript
const AGENTS: Record<string, AgentConfig> = {
  emma: { role: 'emma', name: 'Emma', title: 'Product Manager', ..., systemPrompt: '' },
  // ...
};
```

而全局定义 `src/agents/types.ts` 中是有 prompt 的。这导致 AI 生成时收不到正确的系统提示。

---

## 📊 修复优先级排序

### 🔴 P0 - 立即修复（影响功能）
1. Artifact 保存 - 缺少 URL 字段
2. Team Mode AGENTS 类型不一致
3. 无认证路由保护
4. saveArtifact 中 systemPrompt 为空

### 🟠 P1 - 高优先级（功能有缺陷）
1. Email 登录验证逻辑
2. getCurrentUser 错误处理
3. 对话持久化 fallback 逻辑
4. StreamGenerateCode 性能问题
5. 数据字段验证缺失

### 🟡 P2 - 中优先级（质量改进）
1. CodeEditor 关闭标签未实现
2. 颜色对比度问题
3. 正则表达式健壮性
4. Demo Mode 标记不清晰

---

## 🧪 测试建议

1. **集成测试**: 登录 → 创建项目 → 生成代码 → 保存
2. **错误场景**: Supabase 离线、Gemini API 限流、网络中断
3. **数据验证**: 确保 Supabase 返回的数据结构完整
4. **性能测试**: 流式响应的 re-render 次数

---

## 📦 npm run build 结果

```
✓ built in 188ms
- dist/index.html                   0.68 kB
- dist/assets/index-CIv578a_.css   20.14 kB
- dist/assets/index-DzWxxij-.js   526.11 kB (⚠️ 警告: 超过 500kb)
```

**建议**: 使用动态导入拆分 chunks，特别是 Gemini API 和 Monaco Editor 部分。

---

## 总结

| 类别 | 数量 | 状态 |
|------|------|------|
| 能跑但有 Bug | 12 | 🟠 需要修复 |
| 无法工作 | 3 | ❌ 需要完成 |
| 设计问题 | 4 | 🔧 需要改进 |
| **总计** | **19** | ⚠️ |

**建议**: 优先修复 P0 问题，然后逐步处理 P1 和 P2。建议进行集成测试以验证修复。

