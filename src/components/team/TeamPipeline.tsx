import { Check, Loader2, AlertCircle, Clock } from 'lucide-react';
import type { TeamStep } from '../../types';
import AgentCard from './AgentCard';

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

                {/* 运行中展开输出 */}
                {step.status === 'running' && step.output && (
                  <div
                    className="animate-pulse"
                    style={{ marginTop: 8, padding: 12, borderRadius: 8, fontSize: 12, lineHeight: 1.6, background: '#ffffff', color: '#64748b', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {step.output}
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
