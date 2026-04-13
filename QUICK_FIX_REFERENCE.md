# 快速修复参考指南

## 📂 按文件组织的问题和修复

### `src/App.tsx` (23 行)

**问题 P0:** 路由无认证保护
```
行号: 10-12
现象: 未登录用户可以直接访问 /dashboard 和 /workspace
```

**修复:**
```typescript
import AuthGuard from './components/auth/AuthGuard';

// 改为：
<Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
<Route path="/workspace/:id" element={<AuthGuard><Workspace /></AuthGuard>} />
```

---

### `src/pages/Login.tsx` (191 行)

**问题 P1:** Email 验证不完整 (行 41-65)
```
现象: 
- 未验证邮箱格式
- 未检查密码长度
- email.split('@')[0] 可能在格式错误时返回整个字符串
```

**修复:** 添加正则验证
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  setError('请输入有效的邮箱地址');
  return;
}

if (password.length < 6) {
  setError('密码至少需要 6 个字符');
  return;
}

// 在 split 前添加默认值
const namePart = email.split('@')[0] || 'User';
```

**问题 P1:** 注册后不检查邮件确认 (行 50-52)
```
现象: 注册成功后立即可以登录，未检查 email_confirmed_at
```

**修复:**
```typescript
if (data.user?.email_confirmed_at) {
  // 登录成功
  localStorage.setItem('atomforge_user', JSON.stringify({ ... }));
  navigate('/dashboard');
} else {
  setMessage('请确认邮件后再登录');
}
```

---

### `src/pages/Dashboard.tsx` (241 行)

**问题 P1:** 错误处理隐藏真实问题 (行 58-86)
```
现象: 任何 Supabase 错误都自动回退到 Demo 模式
用户无法区分是演示模式还是连接失败
```

**修复:**
```typescript
async function init() {
  try {
    const user = await supabaseService.getCurrentUser();
    if (cancelled) return;

    if (user) {
      setUserId(user.id);
      const data = await supabaseService.getProjects(user.id);
      if (!cancelled) setProjects(data);
    } else {
      // 真正的未登录 → Demo 模式
      setIsDemo(true);
      setProjects(mockProjects);
    }
  } catch (error) {
    // 错误 → 显示错误而不是自动降级
    console.error('Failed to load projects:', error);
    // 可选：显示错误提示，让用户手动切换 Demo 模式
  }
}
```

---

### `src/pages/Workspace.tsx` (489 行)

**问题 P0:** AGENTS 定义冲突 (行 60-100)
```
现象: 
- 本地定义了 AGENTS Record
- 与 agents/types.ts 中的全局 AGENTS 数组冲突
- systemPrompt 字段为空字符串
```

**修复:** 删除本地定义，使用导入
```typescript
// REMOVE: const AGENTS: Record<...> = { ... }

// ADD 导入:
import { AGENTS } from '../agents/types';
import { AGENT_PROMPTS } from '../agents/prompts';

// 使用时获取 systemPrompt:
const systemPrompt = AGENT_PROMPTS[agentRole] || '';
```

**问题 P1:** 对话持久化错误处理 (行 150-170)
```
现象: addConversation() 使用 .catch() 但没有重试机制
```

**修复:**
```typescript
// 改为带有日志的错误处理
const saveConversation = async (msg: ChatMessage) => {
  try {
    await addConversation({
      pid: projectId,
      role: msg.role,
      content: msg.content,
      metadata: {},
    });
  } catch (err) {
    console.error('Failed to save conversation:', err);
    // 可以选择: 显示用户通知或重试
  }
};
```

**问题 P2:** buildPreviewHtml 正则不够健壮 (行 310-330)
```
现象: 简单的字符串替换容易被 HTML 注入绕过
示例: 注入 <script>alert('xss')</script> 会被执行
```

**修复:** 使用更安全的方法
```typescript
const buildPreviewHtml = (html: string) => {
  // 使用 DOMParser 验证 HTML
  try {
    new DOMParser().parseFromString(html, 'text/html');
  } catch {
    return '<p>Invalid HTML</p>';
  }
  
  // 或使用 sanitize 库
  return DOMPurify.sanitize(html);
};
```

**问题 P0:** Race 模式选择未保存 (行 280-300)
```
现象: 用户选择设计方案后，页面刷新选择丢失
原因: 未调用 updateProject() 保存 selectedRaceEntry
```

**修复:**
```typescript
const handleRaceSelection = async (entryId: string) => {
  setSelectedRaceEntry(entryId);
  
  // 保存到数据库
  try {
    await updateProject(projectId, {
      selected_race_entry: entryId,
      preview_html: raceEntries.find(e => e.id === entryId)?.output,
    });
  } catch (err) {
    console.error('Failed to save race selection:', err);
  }
};
```

---

### `src/services/supabase.ts` (166 行)

**问题 P0:** Artifact 缺失 URL 和 Storage (行 139-159)
```
现象: saveArtifact() 保存记录但不上传文件到 Storage
url 字段为 undefined，工件无法被访问
```

**修复:** 实现完整的 Storage 集成
```typescript
export async function saveArtifact(
  pid: string,
  filename: string,
  content: string,
  filetype: string = 'text',
): Promise<Artifact> {
  // 1. 上传文件
  const filePath = `${pid}/${Date.now()}-${filename}`;
  const { error: uploadError } = await supabase
    .storage
    .from('artifacts')
    .upload(filePath, new Blob([content]));
  
  if (uploadError) throw uploadError;
  
  // 2. 获取公开 URL
  const { data: urlData } = supabase
    .storage
    .from('artifacts')
    .getPublicUrl(filePath);
  
  // 3. 保存数据库记录
  const { data, error } = await supabase
    .from('artifacts')
    .insert({
      pid,
      filename,
      content,
      filetype,
      size_bytes: new Blob([content]).size,
      url: urlData.publicUrl,  // ← 关键：添加 URL
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as Artifact;
}
```

**问题 P1:** 类型转换不安全 (行 83-84)
```
现象: getConversations() 直接转换: return data as Conversation[]
如果字段缺失会导致运行时错误
```

**修复:** 添加验证
```typescript
export async function getConversations(pid: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('pid', pid)
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  // 验证数据结构
  if (!Array.isArray(data)) return [];
  
  return data.filter(item => 
    item && 
    typeof item.id === 'string' && 
    typeof item.content === 'string' &&
    typeof item.role === 'string'
  ) as Conversation[];
}
```

---

### `src/hooks/useChat.ts` (115 行)

**问题 P1:** 流式生成过度重渲染 (行 56-65)
```
现象: 每个 chunk 都复制整个消息对象，导致不必要的重渲染
性能问题: message 引用不断变化，子组件频繁更新
```

**修复:** 最小化更新范围
```typescript
// BEFORE
setMessages((prev) =>
  prev.map((msg) =>
    msg.id === assistantId
      ? { ...msg, content: msg.content + chunk }
      : msg,
  ),
);

// AFTER: 只更新最后一条消息
setMessages((prev) => {
  const updated = [...prev];
  const lastIdx = updated.length - 1;
  if (lastIdx >= 0 && updated[lastIdx]?.id === assistantId) {
    updated[lastIdx] = {
      ...updated[lastIdx],
      content: updated[lastIdx].content + chunk
    };
  }
  return updated;
});
```

---

### `src/components/workspace/CodeEditor.tsx` (102 行)

**问题 P2:** 无法关闭标签页 (行 65-70)
```
现象: 关闭按钮有 onClick 但实现为空注释
```

**修复:**
```typescript
// BEFORE
<button onClick={() => { /* close tab */ }}>×</button>

// AFTER
<button 
  onClick={() => onTabClose?.(tab.filename)}
  aria-label="Close tab"
>
  ×
</button>

// 在父组件处理：
const handleTabClose = (filename: string) => {
  setOpenFiles(prev => prev.filter(f => f.filename !== filename));
};
```

---

### `src/components/workspace/ChatPanel.tsx` (209 行)

**问题 P2:** 对比度不足 (行 90-100)
```
现象: 用户消息背景 #1a2744 文本 #ddd 对比度 ~4.5:1
WCAG AA 要求 4.5:1，AAA 要求 7:1
```

**修复:** 提高对比度
```typescript
// BEFORE
background: '#1a2744',
color: '#ddd',

// AFTER (改进)
background: '#1a2744',
color: '#ffffff',  // 白色对比度 ~7.2:1，满足 AAA

// 或改换背景色
background: '#0f172a',  // 更深的蓝色
color: '#e8f1ff',  // 更亮的蓝白色
```

---

### `src/components/race/RaceView.tsx` (106 行)

**问题 P2:** 选择按钮对比度 (行 45-60)
```
现象: 文本 #0f172a 在背景 #3b82f6 上对比度 ~3.2:1
```

**修复:**
```typescript
// BEFORE
color: '#0f172a',
background: '#3b82f6',

// AFTER
color: '#ffffff',  // 白色对比度 ~5.8:1
background: '#3b82f6',

// 或
color: '#0f172a',
background: '#60a5fa',  // 更亮的蓝色
```

---

## 🔍 验证清单

修复后的验证步骤：

```bash
# 1. 类型检查 (应该没有错误)
npm run type-check

# 2. 构建 (应该成功)
npm run build

# 3. 本地测试
npm run dev

# 4. 手动测试清单
□ 登出后访问 /dashboard 被重定向到 /login
□ 登出后访问 /workspace/xxx 被重定向到 /login
□ Email 字段拒绝 "invalid" 格式
□ 密码字段在 < 6 字符时显示错误
□ 注册后看到邮件确认提示
□ 创建工件后可以下载
□ Race 模式选择在刷新后保留
□ 流式消息平滑更新无闪烁
□ 编辑器标签页可以关闭
□ 所有文本颜色可读性良好
```

---

## 📊 修复优先级速记

| 优先级 | 问题 | 预计时间 | 阶段 |
|--------|------|---------|------|
| 🔴 P0 | 路由保护 | 10 min | D1 |
| 🔴 P0 | Artifact Storage | 45 min | D1 |
| 🔴 P0 | AGENTS 冲突 | 25 min | D1 |
| 🔴 P0 | Race 持久化 | 40 min | D1 |
| 🟡 P1 | Email 验证 | 35 min | D2 |
| 🟡 P1 | 错误处理 | 30 min | D2 |
| 🟡 P1 | 对话保存 | 40 min | D2 |
| 🟡 P1 | 流式优化 | 45 min | D2 |
| 🟡 P1 | 类型安全 | 30 min | D2 |
| 🟠 P2 | 编辑器关闭 | 15 min | D3 |
| 🟠 P2 | HTML 安全 | 25 min | D3 |
| 🟠 P2 | 色彩对比 | 25 min | D3 |

