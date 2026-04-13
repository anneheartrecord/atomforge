# 🐛 AtomForge 问题清单 - 快速参考

## 🔴 P0 - 立即修复（4个问题）

### 1. saveArtifact 缺少 URL 字段
- **文件**: `src/services/supabase.ts:139-159`
- **影响**: Artifact 保存后无法获取 URL
- **修复**: 集成 Supabase Storage 上传并返回公开 URL
- **时间估计**: 30 分钟

### 2. Workspace 中 AGENTS 与全局定义不一致
- **文件**: `src/pages/Workspace.tsx:17-23` vs `src/agents/types.ts`
- **影响**: Team Mode 可能读取错误的 agent 配置
- **修复**: 导入全局 AGENTS 数组，删除本地重复定义
- **时间估计**: 15 分钟

### 3. 缺少路由认证保护
- **文件**: `src/App.tsx`
- **影响**: 未登录用户可直接访问 /dashboard 和 /workspace
- **修复**: 用 AuthGuard 包裹需要认证的页面
- **时间估计**: 10 分钟

### 4. Workspace 中 AGENTS 的 systemPrompt 为空
- **文件**: `src/pages/Workspace.tsx:17-23`
- **影响**: Team Mode 生成时不使用正确的系统提示
- **修复**: 导入全局 AGENT_PROMPTS 或使用从 agents/types.ts 导入的配置
- **时间估计**: 15 分钟

---

## 🟠 P1 - 高优先级（5个问题）

### 5. Email 登录验证逻辑不完整
- **文件**: `src/pages/Login.tsx:49-58`
- **影响**: Sign Up 后可能未验证就存储用户，登录逻辑不清晰
- **修复**: 检查 `data.user.confirmed_at` 和 session 存在性
- **时间估计**: 20 分钟

### 6. Dashboard getCurrentUser 错误处理不完善
- **文件**: `src/pages/Dashboard.tsx:63-74`
- **影响**: Supabase 错误会被隐藏，用户误以为是 Demo 模式
- **修复**: 分离处理 null user 和 network error
- **时间估计**: 15 分钟

### 7. Workspace 对话持久化逻辑有 gap
- **文件**: `src/pages/Workspace.tsx:198-227, 244-247`
- **影响**: 失败后无通知，用户可能丢失对话
- **修复**: 添加加载状态、错误提示和重试逻辑
- **时间估计**: 25 分钟

### 8. StreamGenerateCode 流式更新性能问题
- **文件**: `src/pages/Workspace.tsx:304-312`
- **影响**: 每个 chunk 都导致完整 re-render，可能卡顿
- **修复**: 使用 useRef 或其他优化避免完整替换
- **时间估计**: 20 分钟

### 9. getConversations 类型转换不安全
- **文件**: `src/services/supabase.ts:73-85`
- **影响**: 返回字段不完整时会 crash
- **修复**: 手动映射并提供默认值
- **时间估计**: 15 分钟

---

## 🟡 P2 - 中优先级（4个问题）

### 10. CodeEditor 关闭标签未实现
- **文件**: `src/components/workspace/CodeEditor.tsx:65-68`
- **影响**: UI 显示关闭按钮但不工作
- **修复**: 添加 onDeleteFile 回调或直接调用父组件方法
- **时间估计**: 15 分钟

### 11. RaceView 按钮文字颜色对比度不足
- **文件**: `src/components/race/RaceView.tsx:93`
- **影响**: 文字难以阅读
- **修复**: 改为白色 `#ffffff`
- **时间估计**: 5 分钟

### 12. ChatPanel 用户消息颜色对比度不足
- **文件**: `src/components/workspace/ChatPanel.tsx:130-142`
- **影响**: 文字难以阅读
- **修复**: 根据背景颜色调整文字颜色
- **时间估计**: 5 分钟

### 13. buildPreviewHtml 正则表达式不健壮
- **文件**: `src/pages/Workspace.tsx:229-237`
- **影响**: 可能匹配失败导致预览不更新
- **修复**: 使用更健壮的正则表达式和 HTML 转义
- **时间估计**: 20 分钟

---

## ❌ 无法工作的功能（3个）

### A. Artifact URL 生成缺失
- **文件**: `src/services/supabase.ts:139-159`
- **状态**: 完全不工作
- **修复**: 实现 Storage 上传 + 公开 URL 生成
- **时间估计**: 45 分钟

### B. CDN 资源在 iframe 中可能加载失败
- **文件**: `src/pages/Workspace.tsx:282-327`
- **状态**: 依赖 AI 输出质量，容易失败
- **修复**: 添加 CDN 白名单和 iframe sandbox 策略
- **时间估计**: 30 分钟

### C. Race Mode 选择后无持久化
- **文件**: `src/pages/Workspace.tsx:448-455`
- **状态**: 功能丢失，无法比较结果
- **修复**: 保存选中的 HTML 到 Supabase
- **时间估计**: 25 分钟

---

## 🔧 设计问题（4个）

1. **Demo Mode 混淆**: 无法区分真实数据与 Mock
   - 修复: 添加全局状态标记，UI 中明确显示
   - 时间: 30 分钟

2. **版本控制未使用**: Version 表存在但未实现
   - 修复: 在代码保存时自动创建快照
   - 时间: 45 分钟

3. **useChat 中 role 不一致**: 使用 'assistant' 但其他地方用 agent role
   - 修复: 统一使用 'alex' 作为默认 assistant role
   - 时间: 10 分钟

4. **Error 处理太宽松**: 太多 try-catch 直接 fallback 到 Mock
   - 修复: 添加显式的错误消息和用户提示
   - 时间: 30 分钟

---

## 📊 修复成本总结

| 优先级 | 问题数 | 总时间 | 难度 |
|--------|--------|--------|------|
| 🔴 P0 | 4 | ~70 分 | 🟡 中 |
| 🟠 P1 | 5 | ~95 分 | 🟠 中 |
| 🟡 P2 | 4 | ~65 分 | 🟢 低 |
| 设计 | 4 | ~135 分 | 🟠 中 |
| **总计** | **17** | **~365 分** | - |

---

## ✅ 测试清单

完成修复后需要验证：

- [ ] 登录流程（Email + Google + Demo Mode）
- [ ] 项目创建与列表
- [ ] 进入 Workspace
- [ ] Engineer Mode 生成代码
- [ ] Team Mode 运行 pipeline
- [ ] Race Mode 生成多个变体
- [ ] 选择 Race 结果并保存
- [ ] 对话历史加载
- [ ] 文件编辑保存
- [ ] 代码预览更新
- [ ] 离线/错误场景处理
- [ ] 颜色对比度检查

---

## 🚀 建议修复顺序

1. **第一阶段（关键功能）**: P0 问题 (~70分)
2. **第二阶段（功能完善）**: P1 问题 (~95分)
3. **第三阶段（质量提升）**: P2 + 设计问题 (~200分)
4. **第四阶段（测试）**: 集成测试和回归测试

