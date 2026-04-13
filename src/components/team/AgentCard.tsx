import { Loader2, Check, Minus } from 'lucide-react';
import type { AgentConfig } from '../../types';

interface AgentCardProps {
  agent: AgentConfig;
  status: 'idle' | 'working' | 'done';
  output?: string;
}

export default function AgentCard({ agent, status, output }: AgentCardProps) {
  const borderColor =
    status === 'working' ? agent.color :
    status === 'done' ? '#4ade8060' :
    'rgba(255,255,255,0.06)';

  const statusBadge = {
    idle:    { icon: <Minus size={10} />, label: 'Idle',    bg: '#ffffff08', color: '#555' },
    working: { icon: <Loader2 size={10} className="animate-spin" />, label: 'Working', bg: `${agent.color}20`, color: agent.color },
    done:    { icon: <Check size={10} />,  label: 'Done',    bg: '#4ade8020', color: '#4ade80' },
  }[status];

  return (
    <div
      className="rounded-xl p-3 transition-all duration-300"
      style={{
        background: '#111113',
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
          <div className="text-xs font-medium" style={{ color: '#e5e5e5' }}>{agent.name}</div>
          <div className="text-[11px]" style={{ color: '#555' }}>{agent.title}</div>
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

      {/* 已完成时显示摘要输出 */}
      {status === 'done' && output && (
        <div className="mt-2 text-[11px] leading-relaxed" style={{ color: '#666' }}>
          {output}
        </div>
      )}
    </div>
  );
}
