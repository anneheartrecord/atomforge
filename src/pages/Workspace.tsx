import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Rocket, ChevronDown, Send, Loader2 } from 'lucide-react';
import ChatPanel from '../components/workspace/ChatPanel';
import CodeEditor from '../components/workspace/CodeEditor';
import FileTree from '../components/workspace/FileTree';
import Preview from '../components/workspace/Preview';
import TeamPipeline from '../components/team/TeamPipeline';
import RaceView from '../components/race/RaceView';
import { streamGenerateCode } from '../services/gemini';
import { runTeamPipeline } from '../agents/teamOrchestrator';
import { runRace } from '../agents/raceRunner';
import { getConversations, addConversation, saveArtifact, getProject } from '../services/supabase';
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

    // Engineer mode: stream generate
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
      const fullResponse = await streamGenerateCode(content, (chunk) => {
        accumulated += chunk;
        setMessages(prev => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: accumulated };
          return msgs;
        });
      });

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
              <FileTree
                files={files}
                activeFile={activeFile}
                onFileSelect={setActiveFile}
                onAddFile={handleAddFile}
                onDeleteFile={handleDeleteFile}
              />
              <CodeEditor
                files={files}
                activeFile={activeFile}
                onFileChange={setActiveFile}
                onContentChange={handleContentChange}
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
