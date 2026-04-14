import { Check, Loader2, AlertCircle, Clock } from 'lucide-react';
import type { TeamStep } from '../../types';
import AgentCard from './AgentCard';

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

interface TeamPipelineProps {
  steps: TeamStep[];
  currentStep?: number;
}

function StatusIcon({ status }: { status: TeamStep['status'] }) {
  const base: React.CSSProperties = { width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  switch (status) {
    case 'completed':
      return <div style={{ ...base, background: '#4ade8020', color: '#4ade80' }}><Check size={14} /></div>;
    case 'running':
      return <div style={{ ...base, background: '#3b82f620', color: '#3b82f6' }}><Loader2 size={14} className="animate-spin" /></div>;
    case 'error':
      return <div style={{ ...base, background: '#f8717120', color: '#f87171' }}><AlertCircle size={14} /></div>;
    default:
      return <div style={{ ...base, background: '#ffffff08', color: '#444' }}><Clock size={14} /></div>;
  }
}

export default function TeamPipeline({ steps, currentStep }: TeamPipelineProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 16, paddingRight: 16, height: 44, flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>Team Pipeline</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#444' }}>
          {steps.filter(s => s.status === 'completed').length}/{steps.length} completed
        </span>
      </div>

      {/* 时间线 */}
      <div style={{ flex: 1, paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16 }}>
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isCurrent = idx === currentStep;

          return (
            <div key={step.agent.role} style={{ display: 'flex', gap: 12 }}>
              {/* 竖线 + 节点 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <StatusIcon status={step.status} />
                {!isLast && (
                  <div
                    style={{
                      width: 1,
                      flex: 1,
                      minHeight: 24,
                      background: step.status === 'completed' ? '#4ade8040' : 'rgba(0,0,0,0.06)',
                    }}
                  />
                )}
              </div>

              {/* 内容 */}
              <div style={{ flex: 1, paddingBottom: isLast ? 0 : 24 }}>
                <AgentCard
                  agent={step.agent}
                  status={step.status === 'completed' ? 'done' : step.status === 'running' ? 'working' : 'idle'}
                  output={isCurrent || step.status === 'completed' ? step.output : undefined}
                />

                {/* 运行中展开输出（支持简易 markdown） */}
                {step.status === 'running' && step.output && (
                  <div
                    className="animate-pulse"
                    style={{ marginTop: 8, padding: 12, borderRadius: 8, fontSize: 12, lineHeight: 1.6, background: '#ffffff', color: '#64748b', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <span dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(step.output) }} />
                    <span className="animate-pulse" style={{ display: 'inline-block', width: 6, height: 12, marginLeft: 2, borderRadius: 2, background: '#3b82f6' }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
