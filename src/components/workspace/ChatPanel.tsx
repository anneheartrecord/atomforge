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

// ── Markdown 渲染 ───────────────────────────────────────
function renderMarkdown(text: string) {
  // 拆分代码块
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const lines = part.slice(3, -3).split('\n');
      const lang = lines[0]?.trim() || '';
      const code = lang ? lines.slice(1).join('\n') : lines.join('\n');
      return (
        <pre key={i} style={{ marginTop: 8, marginBottom: 8, padding: 12, borderRadius: 8, fontSize: 12, overflowX: 'auto', background: '#f1f5f9' }}>
          {lang && <div style={{ fontSize: 10, marginBottom: 4, color: '#94a3b8' }}>{lang}</div>}
          <code style={{ color: '#0f172a' }}>{code}</code>
        </pre>
      );
    }
    // 处理行内 markdown：bold, italic, inline code, links, lists
    return <span key={i} dangerouslySetInnerHTML={{ __html: inlineMarkdown(part) }} />;
  });
}

function inlineMarkdown(text: string): string {
  return text
    // Links [text](url) — 指向 /docs 而不是 github
    .replace(/\[([^\]]+)\]\(https:\/\/github\.com\/anneheartrecord\/atomforge\/[^\)]*\)/g, '<a href="/docs" style="color:#3b82f6;text-decoration:underline">$1</a>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#3b82f6;text-decoration:underline">$1</a>')
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code `text`
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px;color:#6366f1">$1</code>')
    // Numbered lists: 1. item
    .replace(/^(\d+)\.\s+(.+)$/gm, '<div style="padding-left:16px;margin:4px 0"><span style="color:#94a3b8;margin-right:6px">$1.</span>$2</div>')
    // Bullet lists: - item or * item
    .replace(/^[\-\*]\s+(.+)$/gm, '<div style="padding-left:16px;margin:4px 0"><span style="color:#94a3b8;margin-right:6px">•</span>$1</div>')
    // Headers (within chat messages, render as bold text)
    .replace(/^#{1,3}\s+(.+)$/gm, '<div style="font-weight:700;margin:12px 0 6px;font-size:15px">$1</div>')
    // Line breaks
    .replace(/\n/g, '<br/>');
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── 顶栏 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 16, height: 44, flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ color: '#64748b' }}>Mode:</span>
          <span style={{ fontWeight: 500, textTransform: 'capitalize' as const, color: '#3b82f6' }}>{mode}</span>
        </div>
        {currentAgent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span>{AGENT_META[currentAgent].avatar}</span>
            <span style={{ color: AGENT_META[currentAgent].color }}>{AGENT_META[currentAgent].name}</span>
          </div>
        )}
      </div>

      {/* ── 消息列表 ── */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12 }}>
        {messages.map((msg, msgIdx) => {
          const isUser = msg.role === 'user';
          const meta = !isUser ? AGENT_META[msg.role as AgentRole] || AGENT_META.assistant : null;

          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: msgIdx < messages.length - 1 ? 16 : 0 }}>
              <div style={{ maxWidth: '85%', ...(isUser ? {} : { display: 'flex', gap: 10 }) }}>
                {/* Agent 头像 */}
                {!isUser && meta && (
                  <div
                    style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginTop: 2, background: `${meta.color}20`, border: `1px solid ${meta.color}40` }}
                  >
                    {meta.avatar}
                  </div>
                )}

                <div>
                  {/* Agent 名字 */}
                  {!isUser && meta && (
                    <div style={{ fontSize: 11, marginBottom: 4, fontWeight: 500, color: meta.color }}>{meta.name}</div>
                  )}

                  {/* 气泡 */}
                  <div
                    style={{
                      padding: 16,
                      fontSize: 14,
                      lineHeight: 1.6,
                      background: isUser ? 'rgba(59,130,246,0.08)' : '#f8fafc',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      color: '#0f172a',
                    }}
                  >
                    {renderMarkdown(msg.content)}
                    {msg.isStreaming && (
                      <span className="animate-pulse" style={{ display: 'inline-block', width: 6, height: 16, marginLeft: 2, borderRadius: 2, background: '#3b82f6' }} />
                    )}
                  </div>

                  {/* 时间 */}
                  <div style={{ fontSize: 10, marginTop: 4, color: '#444' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* 加载中指示 */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 16, borderRadius: 16, fontSize: 12, background: '#f8fafc', color: '#64748b' }}>
              <Loader2 size={14} className="animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </div>

      {/* ── 输入区 ── */}
      <div style={{ padding: 16, flexShrink: 0 }}>
        {/* 模式切换 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          {(['engineer', 'team', 'race'] as WorkspaceMode[]).map(m => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              style={{
                paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4,
                fontSize: 11, borderRadius: 8, textTransform: 'capitalize' as const,
                border: mode === m ? '1px solid #3b82f640' : '1px solid transparent',
                background: mode === m ? '#3b82f620' : 'transparent',
                color: mode === m ? '#3b82f6' : '#555',
                cursor: 'pointer',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: 8, borderRadius: 12, background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build…"
            rows={1}
            style={{ flex: 1, background: 'transparent', fontSize: 14, resize: 'none', outline: 'none', color: '#0f172a', maxHeight: 160, border: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{ padding: 8, borderRadius: 8, flexShrink: 0, border: 'none', cursor: 'pointer', background: '#3b82f6', opacity: (!input.trim() || isLoading) ? 0.3 : 1 }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
