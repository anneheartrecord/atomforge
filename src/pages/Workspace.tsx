import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Rocket, ChevronDown, Send, Loader2, Download, GitBranch } from 'lucide-react';
import ChatPanel from '../components/workspace/ChatPanel';
import CodeEditor from '../components/workspace/CodeEditor';
import FileTree from '../components/workspace/FileTree';
import Preview from '../components/workspace/Preview';
import TeamPipeline from '../components/team/TeamPipeline';
import RaceView from '../components/race/RaceView';
import { streamGenerateCode } from '../services/gemini';
import { runTeamPipeline } from '../agents/teamOrchestrator';
import { runRace } from '../agents/raceRunner';
import { getConversations, addConversation, saveArtifact, getProject, getMemories, addMemory, getCurrentUser } from '../services/supabase';
import { createRepo, pushToGithub } from '../services/github';
import type { ChatMessage, WorkspaceMode, TeamStep, RaceEntry } from '../types';

// ── 默认文件（空，等 AI 生成后才出现）────────────────────
const DEFAULT_FILES: Record<string, string> = {};

// ── Mock 消息（清空，真实数据来自 Supabase）─────────────
const MOCK_MESSAGES: ChatMessage[] = [];

// ── Mock Team Steps（清空）─────────────────────────────────
const MOCK_TEAM_STEPS: TeamStep[] = [];

// ── Mock Race Entries（清空）───────────────────────────────
const MOCK_RACE_ENTRIES: RaceEntry[] = [];

// ── 拖拽 Hook ─────────────────────────────────────────────
function useDraggablePanel(initialLeft: number, initialRight: number) {
  const [leftW, setLeftW] = useState(initialLeft);
  const [rightW, setRightW] = useState(initialRight);
  const dragging = useRef<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = (which: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = which;
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      if (dragging.current === 'left') {
        const clamped = Math.min(Math.max(x, 15), 50);
        setLeftW(clamped);
      } else {
        const clamped = Math.min(Math.max(100 - x, 15), 50);
        setRightW(clamped);
      }
    };
    const onUp = () => { dragging.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const centerW = 100 - leftW - rightW;
  return { containerRef, leftW, centerW, rightW, onMouseDown };
}

// ── 从对话中提取记忆（偏好、事实等）──────────────────────
async function extractAndSaveMemory(userMsg: string, _aiResponse: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    // 简单的规则提取（不调用额外 AI，避免额外成本）
    const memories: Array<{ category: string; content: string }> = [];

    // 提取技术偏好：如果用户提到具体技术栈
    const techPatterns = [
      /(?:我(?:喜欢|习惯|偏好|想用|要用)).*?(react|vue|angular|tailwind|bootstrap|python|node|go|rust)/gi,
      /(?:use|prefer|like|want).*?(react|vue|angular|tailwind|bootstrap|python|node|go|rust)/gi,
    ];
    for (const p of techPatterns) {
      const m = userMsg.match(p);
      if (m) memories.push({ category: 'preference', content: `用户偏好技术栈: ${m[0]}` });
    }

    // 提取风格偏好
    const stylePatterns = [
      /(?:我(?:喜欢|想要|偏好)).*?(?:暗色|深色|亮色|白色|简约|极简|现代|复古)/g,
      /(?:dark|light|minimal|modern|retro|clean)\s*(?:theme|style|mode|design)/gi,
    ];
    for (const p of stylePatterns) {
      const m = userMsg.match(p);
      if (m) memories.push({ category: 'style', content: `设计偏好: ${m[0]}` });
    }

    // 提取项目上下文（如果用户提到公司/产品名）
    if (/(?:我们公司|我的产品|我在做|我负责)(.{2,20})/.test(userMsg)) {
      const match = userMsg.match(/(?:我们公司|我的产品|我在做|我负责)(.{2,20})/);
      if (match) memories.push({ category: 'context', content: `项目背景: ${match[0]}` });
    }

    // 保存到 Supabase
    for (const mem of memories) {
      await addMemory(user.id, mem.category, mem.content);
    }
  } catch {
    // 静默失败，记忆提取是增强功能
  }
}

// ── 从 AI 响应中提取 HTML ────────────────────────────────
function extractHtmlFromResponse(response: string): string | null {
  // Try to extract from markdown code fence
  const fenceMatch = response.match(/```html?\s*\n([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // If response starts with <!DOCTYPE or <html, use it directly
  const trimmed = response.trim();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<HTML')) {
    return trimmed;
  }

  // Look for HTML block in response
  const htmlMatch = response.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
  if (htmlMatch) return htmlMatch[1].trim();

  return null;
}

// ── Team 模式输入框 ──────────────────────────────────────
function TeamPromptInput({ onSend, isLoading }: { onSend: (msg: string) => void; isLoading: boolean }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ paddingLeft: 12, paddingRight: 12, paddingBottom: 12, paddingTop: 8, flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: 8, borderRadius: 12, background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)' }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what the team should build…"
          rows={1}
          style={{ flex: 1, background: 'transparent', fontSize: 14, resize: 'none', outline: 'none', color: '#0f172a', maxHeight: 120, border: 'none' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          style={{ padding: 8, borderRadius: 8, flexShrink: 0, border: 'none', cursor: 'pointer', background: '#3b82f6', opacity: (!input.trim() || isLoading) ? 0.3 : 1 }}
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Workspace 主组件
// ══════════════════════════════════════════════════════════
export default function Workspace() {
  const { id } = useParams<{ id: string }>();
  const pid = id || '';
  // 优先从 sessionStorage 读取 mode（Dashboard 创建时写入）
  const initialMode = (pid && sessionStorage.getItem(`project_mode_${pid}`)) as WorkspaceMode | null;
  const [mode, setMode] = useState<WorkspaceMode>(initialMode || 'engineer');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<Record<string, string>>(DEFAULT_FILES);
  const [activeFile, setActiveFile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [teamSteps, setTeamSteps] = useState<TeamStep[]>(MOCK_TEAM_STEPS);
  const [raceEntries, setRaceEntries] = useState<RaceEntry[]>(MOCK_RACE_ENTRIES);
  const [showFileTree, setShowFileTree] = useState(true);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [ghToken, setGhToken] = useState('');
  const [ghRepo, setGhRepo] = useState('atomforge-output');
  const [ghStatus, setGhStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [ghMessage, setGhMessage] = useState('');

  const { containerRef, leftW, centerW, rightW, onMouseDown } = useDraggablePanel(30, 35);

  // 加载项目信息（包括 mode）
  useEffect(() => {
    if (!pid) return;
    let cancelled = false;

    async function loadProject() {
      try {
        const project = await getProject(pid);
        if (cancelled) return;
        if (project?.mode) {
          setMode(project.mode);
        }
      } catch {
        // 读取失败不影响，使用默认 mode
      }
    }

    // 只在没有从 sessionStorage 读到 mode 时才从 Supabase 加载
    if (!initialMode) {
      loadProject();
    } else {
      // 用完就清理
      sessionStorage.removeItem(`project_mode_${pid}`);
    }

    return () => { cancelled = true; };
  }, [pid, initialMode]);

  // 加载历史对话
  useEffect(() => {
    if (!pid) return;
    let cancelled = false;

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

    loadHistory();
    return () => { cancelled = true; };
  }, [pid]);

  // 构建预览 HTML（简单拼接）
  const buildPreviewHtml = useCallback(() => {
    const html = files['index.html'] || '';
    const css = files['style.css'] || '';
    const js = files['script.js'] || '';
    return html
      .replace(/<link[^>]*href="style\.css"[^>]*\/>/, `<style>${css}</style>`)
      .replace(/<script[^>]*src="script\.js"[^>]*><\/script>/, `<script>${js}<\/script>`);
  }, [files]);

  const handleSend = useCallback(async (content: string) => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // 持久化用户消息
    if (pid) {
      addConversation({ pid, role: 'user', content, metadata: {} }).catch(console.error);
    }

    if (mode === 'team') {
      // Team mode: run full pipeline
      try {
        const steps = await runTeamPipeline(content, (step) => {
          setTeamSteps(prev => {
            const next = [...prev];
            const idx = next.findIndex(s => s.agent.role === step.agent.role);
            if (idx >= 0) next[idx] = step;
            return next;
          });
        });
        // Extract code from Alex's output
        const alexStep = steps.find(s => s.agent.role === 'alex');
        if (alexStep?.output) {
          const code = extractHtmlFromResponse(alexStep.output);
          if (code) {
            setFiles(prev => ({ ...prev, 'index.html': code }));
            // 保存产物到 Supabase
            if (pid) {
              saveArtifact(pid, 'index.html', code, 'html').catch(console.error);
            }
          }
        }
      } catch (err) {
        console.error('Team pipeline error:', err);
      }
      setIsLoading(false);
      return;
    }

    if (mode === 'race') {
      // Race mode: parallel generation
      try {
        await runRace(content, 3, (entries) => {
          setRaceEntries(entries);
        });
      } catch (err) {
        console.error('Race error:', err);
      }
      setIsLoading(false);
      return;
    }

    // Engineer mode: stream generate with conversation history
    // Load user memories for context injection
    let memoryContext = '';
    try {
      const user = await getCurrentUser();
      if (user) {
        const memories = await getMemories(user.id);
        if (memories.length > 0) {
          memoryContext = '\n\n[User Memory - extracted from previous conversations]\n' +
            memories.map(m => `- [${m.category}] ${m.content}`).join('\n') + '\n';
        }
      }
    } catch { /* ignore */ }

    // Build history for Gemini multi-turn chat
    const history = messages
      .filter(m => !m.isStreaming && m.content)
      .map(m => ({
        role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        text: m.content,
      }));

    // Inject memory context into the first user message if available
    const promptWithMemory = memoryContext
      ? `${memoryContext}\n\nUser request: ${content}`
      : content;

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'alex',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      let accumulated = '';
      const fullResponse = await streamGenerateCode(promptWithMemory, (chunk) => {
        accumulated += chunk;
        setMessages(prev => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: accumulated };
          return msgs;
        });
      }, undefined, history);

      // Finalize streaming
      setMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: fullResponse, isStreaming: false };
        return msgs;
      });

      // Try to extract HTML and update preview
      const code = extractHtmlFromResponse(fullResponse);
      if (code) {
        setFiles(prev => ({ ...prev, 'index.html': code }));
        // 保存产物到 Supabase
        if (pid) {
          saveArtifact(pid, 'index.html', code, 'html').catch(console.error);
        }
      }

      // 持久化 AI 回复
      if (pid) {
        addConversation({ pid, role: 'alex', content: fullResponse, metadata: {} }).catch(console.error);
      }

      // Extract and save user memory (preferences, facts)
      extractAndSaveMemory(content, fullResponse).catch(console.error);
    } catch (err) {
      setMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          content: `Error: ${err instanceof Error ? err.message : 'Failed to generate code'}`,
          isStreaming: false,
        };
        return msgs;
      });
    }

    setIsLoading(false);
  }, [mode, pid]);

  // 从 Dashboard 快速输入框跳转过来时，自动发送第一句话
  const quickPromptSent = useRef(false);
  useEffect(() => {
    if (!pid || quickPromptSent.current) return;
    const key = `quick_prompt_${pid}`;
    const prompt = sessionStorage.getItem(key);
    if (prompt) {
      sessionStorage.removeItem(key);
      quickPromptSent.current = true;
      // 延迟一帧确保组件已就绪
      requestAnimationFrame(() => handleSend(prompt));
    }
  }, [pid, handleSend]);

  const handleContentChange = useCallback((file: string, content: string) => {
    setFiles(prev => ({ ...prev, [file]: content }));
  }, []);

  const handleAddFile = useCallback((name: string) => {
    if (!files[name]) {
      setFiles(prev => ({ ...prev, [name]: '' }));
      setActiveFile(name);
    }
  }, [files]);

  const handleDeleteFile = useCallback((name: string) => {
    setFiles(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    if (activeFile === name) {
      const remaining = Object.keys(files).filter(k => k !== name);
      setActiveFile(remaining[0] || '');
    }
  }, [activeFile, files]);

  // ── Render ────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#ffffff', color: '#0f172a' }}>
      {/* ─── 顶部工具栏 ─── */}
      <header
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 20, height: 52, flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        {/* 左：项目名 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, background: '#3b82f6', color: '#fff' }}>⚛</div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>AtomForge</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>/</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>my-project</span>
        </div>

        {/* 中：模式切换 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 4, borderRadius: 12, background: '#f1f5f9' }}>
          {(['engineer', 'team', 'race'] as WorkspaceMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                paddingLeft: 20, paddingRight: 20, paddingTop: 8, paddingBottom: 8,
                fontSize: 12, fontWeight: 500, borderRadius: 8, border: 'none', cursor: 'pointer',
                textTransform: 'capitalize' as const,
                background: mode === m ? '#3b82f6' : 'transparent',
                color: mode === m ? '#fff' : '#64748b',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* 右：操作区 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Download 按钮 */}
          <button
            onClick={() => {
              const fileKeys = Object.keys(files);
              if (fileKeys.length === 0) return;
              let output: string;
              let filename: string;
              if (fileKeys.length === 1 && fileKeys[0].endsWith('.html')) {
                output = files[fileKeys[0]];
                filename = 'atomforge-export.html';
              } else {
                // 多文件：将 CSS/JS inline 到 HTML 中
                const html = files['index.html'] || '';
                const css = files['style.css'] || '';
                const js = files['script.js'] || '';
                if (html) {
                  output = html
                    .replace(/<link[^>]*href="style\.css"[^>]*\/?>/,  `<style>${css}</style>`)
                    .replace(/<script[^>]*src="script\.js"[^>]*><\/script>/, `<script>${js}<\/script>`);
                } else {
                  // 没有 index.html，把所有文件拼接
                  output = fileKeys.map(k => `<!-- ${k} -->\n${files[k]}`).join('\n\n');
                }
                filename = 'atomforge-export.html';
              }
              const blob = new Blob([output], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename;
              a.click();
              URL.revokeObjectURL(url);
            }}
            title="Download as HTML"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#f8fafc', color: '#64748b' }}
          >
            <Download size={14} />
          </button>
          {/* GitHub 推送按钮 */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowGithubModal(prev => !prev); setGhStatus('idle'); setGhMessage(''); }}
              title="Push to GitHub"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#f8fafc', color: '#64748b' }}
            >
              <GitBranch size={14} />
            </button>
            {showGithubModal && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                width: 320, padding: 16, borderRadius: 12, background: '#fff',
                border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 50, display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Push to GitHub</div>
                <input
                  type="password"
                  placeholder="GitHub Personal Access Token"
                  value={ghToken}
                  onChange={e => setGhToken(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
                <input
                  type="text"
                  placeholder="Repository name"
                  value={ghRepo}
                  onChange={e => setGhRepo(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
                {ghMessage && (
                  <div style={{ fontSize: 11, color: ghStatus === 'error' ? '#ef4444' : '#22c55e', wordBreak: 'break-all' }}>
                    {ghMessage}
                  </div>
                )}
                <button
                  disabled={!ghToken || !ghRepo || ghStatus === 'loading'}
                  onClick={async () => {
                    setGhStatus('loading');
                    setGhMessage('');
                    try {
                      // 获取当前用户名
                      const userRes = await fetch('https://api.github.com/user', {
                        headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' },
                      });
                      if (!userRes.ok) throw new Error('Invalid token');
                      const userData = await userRes.json();
                      const owner = userData.login;
                      // 尝试创建仓库（如果已存在会报错，忽略）
                      try { await createRepo(ghToken, ghRepo, 'Created by AtomForge'); } catch { /* repo may exist */ }
                      const fullRepo = `${owner}/${ghRepo}`;
                      const commitUrl = await pushToGithub(ghToken, fullRepo, files);
                      setGhStatus('success');
                      setGhMessage(`Pushed! ${commitUrl}`);
                    } catch (err) {
                      setGhStatus('error');
                      setGhMessage(err instanceof Error ? err.message : 'Push failed');
                    }
                  }}
                  style={{
                    padding: '8px 16px', fontSize: 12, fontWeight: 500, borderRadius: 8,
                    border: 'none', cursor: 'pointer', color: '#fff',
                    background: (!ghToken || !ghRepo || ghStatus === 'loading') ? '#94a3b8' : '#0f172a',
                  }}
                >
                  {ghStatus === 'loading' ? 'Pushing…' : 'Push to GitHub'}
                </button>
              </div>
            )}
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 20, paddingRight: 20, paddingTop: 8, paddingBottom: 8, fontSize: 12, fontWeight: 500, borderRadius: 8, border: 'none', cursor: 'pointer', color: '#fff', background: '#3b82f6' }}>
            <Rocket size={14} />
            Publish
          </button>
          <button style={{ padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#f8fafc' }}>
            <ChevronDown size={14} />
          </button>
        </div>
      </header>

      {/* ─── 主体三栏 ─── */}
      <div ref={containerRef} style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* 左栏 – Chat / Team Pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', width: `${leftW}%`, borderRight: '1px solid rgba(0,0,0,0.06)' }}>
          {mode === 'team' ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <TeamPipeline steps={teamSteps} currentStep={teamSteps.findIndex(s => s.status === 'running')} />
              </div>
              {/* Team 模式输入区 */}
              <TeamPromptInput onSend={handleSend} isLoading={isLoading} />
            </div>
          ) : (
            <ChatPanel
              messages={messages}
              onSend={handleSend}
              mode={mode}
              onModeChange={setMode}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* 拖拽手柄 left */}
        <div
          style={{ width: 4, cursor: 'col-resize', flexShrink: 0 }}
          onMouseDown={onMouseDown('left')}
        />

        {/* 中栏 – FileTree + Editor / Race View */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', width: `${centerW}%` }}>
          {mode === 'race' ? (
            <RaceView entries={raceEntries} onSelect={id => {
              const entry = raceEntries.find(e => e.id === id);
              if (entry?.output) {
                setFiles(prev => ({ ...prev, 'index.html': entry.output }));
                if (pid) {
                  saveArtifact(pid, 'index.html', entry.output, 'html').catch(console.error);
                }
                setMode('engineer');
              }
            }} />
          ) : (
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
              {showFileTree && (
                <FileTree
                  files={files}
                  activeFile={activeFile}
                  onFileSelect={setActiveFile}
                  onAddFile={handleAddFile}
                  onDeleteFile={handleDeleteFile}
                />
              )}
              <CodeEditor
                files={files}
                activeFile={activeFile}
                onFileChange={setActiveFile}
                onContentChange={handleContentChange}
                onToggleFileTree={() => setShowFileTree(prev => !prev)}
                showFileTree={showFileTree}
              />
            </div>
          )}
        </div>

        {/* 拖拽手柄 right */}
        <div
          style={{ width: 4, cursor: 'col-resize', flexShrink: 0 }}
          onMouseDown={onMouseDown('right')}
        />

        {/* 右栏 – Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', width: `${rightW}%`, borderLeft: '1px solid rgba(0,0,0,0.06)' }}>
          <Preview html={buildPreviewHtml()} title="my-project" />
        </div>
      </div>
    </div>
  );
}
