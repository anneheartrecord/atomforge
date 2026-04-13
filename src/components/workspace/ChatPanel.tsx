import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { ChatMessage, WorkspaceMode, AgentRole } from '../../types';

// ── Agent 元数据 ──────────────────────────────────────────
const AGENT_META: Record<string, { name: string; avatar: string; color: string }> = {
  emma:  { name: 'Emma',  avatar: '👩‍💼', color: '#f472b6' },
  bob:   { name: 'Bob',   avatar: '🧑‍💻', color: '#60a5fa' },
  alex:  { name: 'Alex',  avatar: '👨‍💻', color: '#4ade80' },
  luna:  { name: 'Luna',  avatar: '🎨', color: '#c084fc' },
  sarah: { name: 'Sarah', avatar: '🔍', color: '#facc15' },
  assistant: { name: 'Assistant', avatar: '🤖', color: '#3b82f6' },
};

// ── 简易 Markdown 渲染 ───────────────────────────────────
function renderMarkdown(text: string) {
  // 拆分代码块
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const lines = part.slice(3, -3).split('\n');
      const lang = lines[0]?.trim() || '';
      const code = lang ? lines.slice(1).join('\n') : lines.join('\n');
      return (
        <pre key={i} className="my-2 p-3 rounded-lg text-xs overflow-x-auto" style={{ background: '#ffffff' }}>
          {lang && <div className="text-[10px] mb-1" style={{ color: '#94a3b8' }}>{lang}</div>}
          <code style={{ color: '#0f172a' }}>{code}</code>
        </pre>
      );
    }
    // 行内 code
    const inlineParts = part.split(/(`[^`]+`)/g);
    return (
      <span key={i}>
        {inlineParts.map((ip, j) =>
          ip.startsWith('`') && ip.endsWith('`') ? (
            <code key={j} className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#f8fafc', color: '#c084fc' }}>
              {ip.slice(1, -1)}
            </code>
          ) : (
            <span key={j} className="whitespace-pre-wrap">{ip}</span>
          )
        )}
      </span>
    );
  });
}

// ── Props ─────────────────────────────────────────────────
interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (msg: string) => void;
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  isLoading: boolean;
}

// ══════════════════════════════════════════════════════════
export default function ChatPanel({ messages, onSend, mode, onModeChange, isLoading }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚到底部
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // textarea 自适应高度
  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; }
  }, [input]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
  }, [input, isLoading, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const currentAgent = mode === 'engineer' ? 'alex' : undefined;

  return (
    <div className="flex flex-col h-full">
      {/* ── 顶栏 ── */}
      <div className="flex items-center justify-between px-4 h-11 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2 text-xs">
          <span style={{ color: '#64748b' }}>Mode:</span>
          <span className="font-medium capitalize" style={{ color: '#3b82f6' }}>{mode}</span>
        </div>
        {currentAgent && (
          <div className="flex items-center gap-1.5 text-xs">
            <span>{AGENT_META[currentAgent].avatar}</span>
            <span style={{ color: AGENT_META[currentAgent].color }}>{AGENT_META[currentAgent].name}</span>
          </div>
        )}
      </div>

      {/* ── 消息列表 ── */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          const meta = !isUser ? AGENT_META[msg.role as AgentRole] || AGENT_META.assistant : null;

          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${isUser ? '' : 'flex gap-2.5'}`}>
                {/* Agent 头像 */}
                {!isUser && meta && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
                    style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}40` }}
                  >
                    {meta.avatar}
                  </div>
                )}

                <div>
                  {/* Agent 名字 */}
                  {!isUser && meta && (
                    <div className="text-[11px] mb-1 font-medium" style={{ color: meta.color }}>{meta.name}</div>
                  )}

                  {/* 气泡 */}
                  <div
                    className="p-4 text-sm leading-relaxed"
                    style={{
                      background: isUser ? 'rgba(59,130,246,0.08)' : '#f8fafc',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      color: '#0f172a',
                    }}
                  >
                    {renderMarkdown(msg.content)}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse rounded-sm" style={{ background: '#3b82f6' }} />
                    )}
                  </div>

                  {/* 时间 */}
                  <div className="text-[10px] mt-1" style={{ color: '#444' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* 加载中指示 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 p-4 rounded-2xl text-xs" style={{ background: '#f8fafc', color: '#64748b' }}>
              <Loader2 size={14} className="animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </div>

      {/* ── 输入区 ── */}
      <div className="p-4 shrink-0">
        {/* 模式切换 */}
        <div className="flex items-center gap-1 mb-2">
          {(['engineer', 'team', 'race'] as WorkspaceMode[]).map(m => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className="px-3 py-1 text-[11px] rounded-lg capitalize transition-all"
              style={{
                background: mode === m ? '#3b82f620' : 'transparent',
                color: mode === m ? '#3b82f6' : '#555',
                border: mode === m ? '1px solid #3b82f640' : '1px solid transparent',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2 p-2 rounded-xl" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build…"
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-gray-600"
            style={{ color: '#0f172a', maxHeight: '160px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg transition-colors shrink-0 disabled:opacity-30"
            style={{ background: '#3b82f6' }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
