import { useState, useCallback, useRef, useEffect } from 'react';
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
import type { ChatMessage, WorkspaceMode, AgentConfig, TeamStep, RaceEntry } from '../types';

// ── Agent 配置 ────────────────────────────────────────────
const AGENTS: Record<string, AgentConfig> = {
  emma: { role: 'emma', name: 'Emma', title: 'Product Manager', description: 'Defines requirements and user stories', color: '#f472b6', avatar: '👩‍💼', systemPrompt: '' },
  bob:  { role: 'bob',  name: 'Bob',  title: 'Architect',       description: 'Designs system architecture',       color: '#60a5fa', avatar: '🧑‍💻', systemPrompt: '' },
  alex: { role: 'alex', name: 'Alex', title: 'Engineer',        description: 'Writes production code',             color: '#4ade80', avatar: '👨‍💻', systemPrompt: '' },
  luna: { role: 'luna', name: 'Luna', title: 'Designer',        description: 'Handles UI/UX and styling',          color: '#c084fc', avatar: '🎨', systemPrompt: '' },
  sarah:{ role: 'sarah',name: 'Sarah',title: 'QA Engineer',     description: 'Tests and reviews code',             color: '#facc15', avatar: '🔍', systemPrompt: '' },
};

// ── Mock 文件 ─────────────────────────────────────────────
const DEFAULT_FILES: Record<string, string> = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AtomForge Preview</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="app">
    <h1>Hello, AtomForge ⚛️</h1>
    <p>Start chatting to generate code.</p>
  </div>
  <script src="script.js"><\/script>
</body>
</html>`,
  'style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #09090b;
  color: #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
h1 { font-size: 2rem; margin-bottom: .5rem; }
p  { color: #888; }`,
  'script.js': `console.log('AtomForge ready');`,
};

// ── Mock 消息 ─────────────────────────────────────────────
const MOCK_MESSAGES: ChatMessage[] = [
  { id: '1', role: 'user',      content: 'Create a landing page with a hero section', timestamp: new Date(Date.now() - 120000).toISOString() },
  { id: '2', role: 'alex',      content: "Sure! I'll build a responsive hero section with a gradient background and CTA button.\n\n```html\n<section class=\"hero\">\n  <h1>Welcome to AtomForge</h1>\n  <p>AI-powered code generation</p>\n  <button>Get Started</button>\n</section>\n```", timestamp: new Date(Date.now() - 60000).toISOString() },
  { id: '3', role: 'user',      content: 'Looks great, can you also add dark mode?', timestamp: new Date().toISOString() },
];

// ── Mock Team Steps ───────────────────────────────────────
const MOCK_TEAM_STEPS: TeamStep[] = [
  { agent: AGENTS.emma,  status: 'completed', output: 'Defined user stories for the landing page.' },
  { agent: AGENTS.bob,   status: 'completed', output: 'Designed component architecture with Hero, Features, CTA sections.' },
  { agent: AGENTS.alex,  status: 'running',   output: 'Writing React components...' },
  { agent: AGENTS.luna,  status: 'pending',   output: '' },
  { agent: AGENTS.sarah, status: 'pending',   output: '' },
];

// ── Mock Race Entries ─────────────────────────────────────
const MOCK_RACE_ENTRIES: RaceEntry[] = [
  { id: 'r1', prompt: 'Landing page', output: '<html><body style="background:#111;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div><h1 style="font-size:3rem">Design A</h1><p style="color:#888">Minimalist approach</p></div></body></html>', status: 'completed' },
  { id: 'r2', prompt: 'Landing page', output: '<html><body style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center"><h1 style="font-size:3rem;background:linear-gradient(90deg,#6366f1,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Design B</h1><p style="color:#aaa">Gradient style</p></div></body></html>', status: 'completed' },
  { id: 'r3', prompt: 'Landing page', output: '<html><body style="background:#09090b;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:monospace"><div style="border:1px solid #333;padding:3rem;border-radius:12px"><h1 style="color:#4ade80">Design C</h1><p style="color:#666">Terminal vibes</p></div></body></html>', status: 'running' },
];

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
    <div className="px-3 pb-3 pt-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-end gap-2 p-2 rounded-xl" style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)' }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what the team should build…"
          rows={1}
          className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-gray-600"
          style={{ color: '#e5e5e5', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="p-2 rounded-lg transition-colors shrink-0 disabled:opacity-30"
          style={{ background: '#6366f1' }}
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
  const [mode, setMode] = useState<WorkspaceMode>('engineer');
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [files, setFiles] = useState<Record<string, string>>(DEFAULT_FILES);
  const [activeFile, setActiveFile] = useState('index.html');
  const [isLoading, setIsLoading] = useState(false);
  const [teamSteps, setTeamSteps] = useState<TeamStep[]>(MOCK_TEAM_STEPS);
  const [raceEntries, setRaceEntries] = useState<RaceEntry[]>(MOCK_RACE_ENTRIES);

  const { containerRef, leftW, centerW, rightW, onMouseDown } = useDraggablePanel(30, 35);

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
  }, [mode]);

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
    <div className="flex flex-col h-screen" style={{ background: '#09090b', color: '#e5e5e5' }}>
      {/* ─── 顶部工具栏 ─── */}
      <header
        className="flex items-center justify-between px-5 h-13 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* 左：项目名 */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: '#6366f1' }}>⚛</div>
          <span className="font-semibold text-sm">AtomForge</span>
          <span className="text-xs" style={{ color: '#555' }}>/</span>
          <span className="text-xs" style={{ color: '#888' }}>my-project</span>
        </div>

        {/* 中：模式切换 */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#111113' }}>
          {(['engineer', 'team', 'race'] as WorkspaceMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-5 py-2 text-xs font-medium rounded-lg transition-all capitalize"
              style={{
                background: mode === m ? '#6366f1' : 'transparent',
                color: mode === m ? '#fff' : '#888',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* 右：操作区 */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-5 py-2 text-xs font-medium rounded-lg transition-colors" style={{ background: '#6366f1' }}>
            <Rocket size={14} />
            Publish
          </button>
          <button className="p-2 rounded-lg" style={{ background: '#18181b' }}>
            <ChevronDown size={14} />
          </button>
        </div>
      </header>

      {/* ─── 主体三栏 ─── */}
      <div ref={containerRef} className="flex flex-1 min-h-0">
        {/* 左栏 – Chat / Team Pipeline */}
        <div className="flex flex-col min-h-0 overflow-hidden" style={{ width: `${leftW}%`, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {mode === 'team' ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 min-h-0 overflow-y-auto">
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
          className="w-1 cursor-col-resize hover:bg-blue-500/30 transition-colors shrink-0"
          onMouseDown={onMouseDown('left')}
        />

        {/* 中栏 – FileTree + Editor / Race View */}
        <div className="flex flex-col min-h-0 overflow-hidden" style={{ width: `${centerW}%` }}>
          {mode === 'race' ? (
            <RaceView entries={raceEntries} onSelect={id => {
              const entry = raceEntries.find(e => e.id === id);
              if (entry?.output) {
                setFiles(prev => ({ ...prev, 'index.html': entry.output }));
                setMode('engineer');
              }
            }} />
          ) : (
            <div className="flex flex-1 min-h-0">
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
          className="w-1 cursor-col-resize hover:bg-blue-500/30 transition-colors shrink-0"
          onMouseDown={onMouseDown('right')}
        />

        {/* 右栏 – Preview */}
        <div className="flex flex-col min-h-0 overflow-hidden" style={{ width: `${rightW}%`, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          <Preview html={buildPreviewHtml()} title="my-project" />
        </div>
      </div>
    </div>
  );
}
