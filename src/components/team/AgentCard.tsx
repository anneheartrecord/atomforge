import { Loader2, Check, Minus } from 'lucide-react';
import type { AgentConfig } from '../../types';

function renderSimpleMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 style="margin:6px 0 2px;font-size:12px;font-weight:600">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="margin:8px 0 2px;font-size:13px;font-weight:600">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="margin:8px 0 4px;font-size:14px;font-weight:700">$1</h1>')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre style="background:#f1f5f9;padding:6px 10px;border-radius:4px;overflow-x:auto;font-size:11px;line-height:1.5"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:1px 3px;border-radius:2px;font-size:11px">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[*-] (.+)$/gm, '<li style="margin-left:16px;list-style:disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:16px;list-style:decimal">$1</li>')
    .replace(/\n{2,}/g, '<br/><br/>');
  return html;
}

interface AgentCardProps {
  agent: AgentConfig;
  status: 'idle' | 'working' | 'done';
  output?: string;
}

export default function AgentCard({ agent, status, output }: AgentCardProps) {
  const borderColor =
    status === 'working' ? agent.color :
    status === 'done' ? '#4ade8060' :
    'rgba(0,0,0,0.06)';

  const statusBadge = {
    idle:    { icon: <Minus size={10} />, label: 'Idle',    bg: '#ffffff08', color: '#94a3b8' },
    working: { icon: <Loader2 size={10} className="animate-spin" />, label: 'Working', bg: `${agent.color}20`, color: agent.color },
    done:    { icon: <Check size={10} />,  label: 'Done',    bg: '#4ade8020', color: '#4ade80' },
  }[status];

  return (
    <div
      className="rounded-xl p-3 transition-all duration-300"
      style={{
        background: '#ffffff',
        border: `1px solid ${borderColor}`,
        ...(status === 'working' ? { boxShadow: `0 0 20px ${agent.color}10` } : {}),
      }}
    >
      <div className="flex items-center gap-2.5">
        {/* 头像 */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}
        >
          {agent.avatar}
        </div>

        {/* 名字 + 职位 */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium" style={{ color: '#0f172a' }}>{agent.name}</div>
          <div className="text-[11px]" style={{ color: '#94a3b8' }}>{agent.title}</div>
        </div>

        {/* 状态 badge */}
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{ background: statusBadge.bg, color: statusBadge.color }}
        >
          {statusBadge.icon}
          {statusBadge.label}
        </div>
      </div>

      {/* 已完成时显示摘要输出（支持简易 markdown） */}
      {status === 'done' && output && (
        <div
          className="mt-2 text-[11px] leading-relaxed"
          style={{ color: '#64748b' }}
          dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(output) }}
        />
      )}
    </div>
  );
}
