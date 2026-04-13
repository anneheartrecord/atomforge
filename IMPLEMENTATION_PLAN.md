# AtomForge 实施计划

## 📋 优先级分类

### 🔴 P0 - 严重问题（必须立即修复）
**影响:** 应用核心功能无法正常工作或安全性问题
**预计工时:** ~120分钟

| # | 问题 | 文件 | 行号 | 紧急度 |
|---|------|------|------|--------|
| 1 | 未受保护的路由 - /dashboard 和 /workspace 无认证检查 | src/App.tsx | 10-12 | 🔴🔴 |
| 2 | Artifact 类型缺失 URL 字段 - saveArtifact() 无法生成可用的工件 | src/types/index.ts + src/services/supabase.ts | 85, 139-159 | 🔴🔴 |
| 3 | AGENTS 定义冲突 - Workspace.tsx 本地定义与全局 agents/types.ts 冲突 | src/pages/Workspace.tsx | 60-100 | 🔴 |
| 4 | Race 模式选择未持久化 - 用户选择的设计不保存到数据库 | src/pages/Workspace.tsx | 280-300 | 🔴 |

### 🟡 P1 - 高优先级（应该修复）
**影响:** 功能部分能工作但存在逻辑错误或边界情况
**预计工时:** ~180分钟

| # | 问题 | 文件 | 行号 |
|---|------|------|------|
| 5 | Email 验证逻辑不完整 | src/pages/Login.tsx | 41-65 |
| 6 | 注册后不检查 confirmed_at 状态 | src/pages/Login.tsx | 50-52 |
| 7 | getCurrentUser() 错误返回 null 隐藏真实错误 | src/pages/Dashboard.tsx | 58-86 |
| 8 | 对话持久化错误处理不当 | src/pages/Workspace.tsx | 150-170 |
| 9 | 流式生成导致过度重渲染 | src/hooks/useChat.ts | 56-65 |
| 10 | Supabase 类型转换不安全 | src/services/supabase.ts | 83-84 |

### 🟠 P2 - 中等优先级（应该修复）
**影响:** UI/UX 问题、性能问题或次要功能缺陷
**预计工时:** ~65分钟

| # | 问题 | 文件 | 行号 |
|---|------|------|------|
| 11 | 无法关闭编辑器标签页 | src/components/workspace/CodeEditor.tsx | 65-70 |
| 12 | buildPreviewHtml 正则表达式不够健壮 | src/pages/Workspace.tsx | 310-330 |
| 13 | 聊天消息对比度不足 WCAG 标准 | src/components/workspace/ChatPanel.tsx | 90-100 |
| 14 | Race 视图选择按钮对比度过低 | src/components/race/RaceView.tsx | 45-60 |

---

## 🚀 推荐实施顺序

### 第1阶段：安全性和核心功能（Day 1）
**时间:** ~120分钟

```
1. 修复路由保护 (P0-1) → 10 min
2. 修复 Artifact URL 和 Storage (P0-2) → 45 min
3. 解决 AGENTS 冲突 (P0-3) → 25 min
4. 保存 Race 模式选择 (P0-4) → 40 min
```

**验证:**
```bash
npm run build
npm test  # 如果有测试
```

### 第2阶段：逻辑和数据完整性（Day 2）
**时间:** ~180分钟

```
5. 修复 Email 验证 (P1-5,6) → 35 min
6. 改进错误处理 (P1-7) → 30 min
7. 修复对话持久化 (P1-8) → 40 min
8. 优化流式渲染 (P1-9) → 45 min
9. 安全类型转换 (P1-10) → 30 min
```

### 第3阶段：UX 和性能（Day 3）
**时间:** ~65分钟

```
10. 编辑器关闭功能 (P2-11) → 15 min
11. 改进 HTML 预览 (P2-12) → 25 min
12. 修复对比度问题 (P2-13,14) → 25 min
```

---

## ✅ 修复清单

### P0 修复 - 路由保护

**文件:** `src/App.tsx`
```typescript
// BEFORE
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/workspace/:id" element={<Workspace />} />

// AFTER
<Route 
  path="/dashboard" 
  element={<AuthGuard><Dashboard /></AuthGuard>} 
/>
<Route 
  path="/workspace/:id" 
  element={<AuthGuard><Workspace /></AuthGuard>} 
/>
```

### P0 修复 - Artifact 存储

**文件:** `src/services/supabase.ts`
```typescript
export async function saveArtifact(
  pid: string,
  filename: string,
  content: string,
  filetype: string = 'text',
): Promise<Artifact> {
  // 1. 生成存储路径
  const filePath = `${pid}/${Date.now()}-${filename}`;
  
  // 2. 上传到 Supabase Storage
  const { error: uploadError } = await supabase
    .storage
    .from('artifacts')
    .upload(filePath, new Blob([content]));
    
  if (uploadError) throw uploadError;
  
  // 3. 生成公开 URL
  const { data: urlData } = supabase
    .storage
    .from('artifacts')
    .getPublicUrl(filePath);
    
  // 4. 保存记录到数据库
  const { data, error } = await supabase
    .from('artifacts')
    .insert({
      pid,
      filename,
      content,
      filetype,
      size_bytes: new Blob([content]).size,
      url: urlData.publicUrl,  // 添加 URL 字段
    })
    .select()
    .single();

  if (error) throw error;
  return data as Artifact;
}
```

### P0 修复 - AGENTS 统一

**文件:** `src/pages/Workspace.tsx`
```typescript
// REMOVE 本地定义：
// const AGENTS: Record<string, AgentConfig> = { ... }

// 替换为导入全局定义：
import { AGENTS } from '../agents/types';

// 在需要使用 systemPrompt 的地方：
const systemPrompt = AGENT_PROMPTS[agentRole] || '';
```

### P1 修复 - Email 验证

**文件:** `src/pages/Login.tsx`
```typescript
const handleEmailAuth = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 添加完整验证
  if (!email || !password) {
    setError('请输入邮箱和密码');
    return;
  }
  
  // Email 格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError('请输入有效的邮箱地址');
    return;
  }
  
  // 密码长度检查
  if (password.length < 6) {
    setError('密码至少需要 6 个字符');
    return;
  }
  
  setIsLoading(true);
  setError('');
  setMessage('');

  try {
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setMessage('验证邮件已发送，请检查您的收件箱');
      // 注意：用户需要确认邮件才能登录
    } else {
      const { error, data } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      if (error) throw error;
      
      // 检查邮件是否已确认
      if (data.user?.email_confirmed_at) {
        const namePart = email.split('@')[0] || 'User';
        localStorage.setItem(
          'atomforge_user', 
          JSON.stringify({ name: namePart, email })
        );
        navigate('/dashboard');
      } else {
        setMessage('请确认邮件后再登录');
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '认证失败';
    setError(msg);
  } finally {
    setIsLoading(false);
  }
};
```

### P1 修复 - 流式优化

**文件:** `src/hooks/useChat.ts`
```typescript
// BEFORE: 每次 chunk 都复制整个消息对象
setMessages((prev) =>
  prev.map((msg) =>
    msg.id === assistantId
      ? { ...msg, content: msg.content + chunk }  // 复制所有字段
      : msg,
  ),
);

// AFTER: 只更新 content 字段
setMessages((prev) => {
  const lastMsg = prev[prev.length - 1];
  if (lastMsg?.id === assistantId) {
    return [
      ...prev.slice(0, -1),
      { ...lastMsg, content: lastMsg.content + chunk }
    ];
  }
  return prev;
});
```

---

## 📊 总体统计

| 指标 | 数值 |
|------|------|
| 总问题数 | 19 |
| P0 (严重) | 4 |
| P1 (高) | 6 |
| P2 (中) | 4 |
| Design | 5 |
| **总预计工时** | **~365 分钟** |
| **推荐分配** | 3 天，每天 ~120 分钟 |

---

## 🧪 测试检查表

完成每个阶段后运行：

```bash
# 类型检查
npm run type-check

# 构建验证
npm run build

# 本地测试
npm run dev

# 检查清单
- [ ] 未登录用户无法访问 /dashboard
- [ ] 未登录用户无法访问 /workspace
- [ ] Email 验证正确拒绝无效格式
- [ ] 工件可以成功上传和下载
- [ ] Race 模式选择在页面刷新后保留
- [ ] 团队流程正确执行 5 个代理
- [ ] 流式消息不会导致闪烁
```

---

## 📝 提交消息建议

```
fix: add route protection with AuthGuard
fix: implement Artifact storage with Supabase Storage
fix: resolve AGENTS definition conflict in Workspace
fix: persist Race mode selection to database
fix: improve email validation and confirmation checks
fix: optimize streaming message rendering
fix: add close button to code editor tabs
fix: enhance HTML preview security and robustness
fix: improve UI color contrast for WCAG compliance
```

