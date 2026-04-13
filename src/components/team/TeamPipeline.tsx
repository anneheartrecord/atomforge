import { Check, Loader2, AlertCircle, Clock } from 'lucide-react';
import type { TeamStep } from '../../types';
import AgentCard from './AgentCard';

interface TeamPipelineProps {
  steps: TeamStep[];
  currentStep?: number;
}

function StatusIcon({ status }: { status: TeamStep['status'] }) {
  switch (status) {
    case 'completed':
      return (
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#4ade8020', color: '#4ade80' }}>
          <Check size={14} />
        </div>
      );
    case 'running':
      return (
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#3b82f620', color: '#3b82f6' }}>
          <Loader2 size={14} className="animate-spin" />
        </div>
      );
    case 'error':
      return (
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#f8717120', color: '#f87171' }}>
          <AlertCircle size={14} />
        </div>
      );
    default:
      return (
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#ffffff08', color: '#444' }}>
          <Clock size={14} />
        </div>
      );
  }
}

export default function TeamPipeline({ steps, currentStep }: TeamPipelineProps) {
  return (
    <div className="flex flex-col h-full">
      {/* 标题 */}
      <div className="flex items-center px-4 h-11 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <span className="text-xs font-medium" style={{ color: '#64748b' }}>Team Pipeline</span>
        <span className="ml-auto text-[11px]" style={{ color: '#444' }}>
          {steps.filter(s => s.status === 'completed').length}/{steps.length} completed
        </span>
      </div>

      {/* 时间线 */}
      <div className="flex-1 px-4 py-4 space-y-0">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isCurrent = idx === currentStep;

          return (
            <div key={step.agent.role} className="flex gap-3">
              {/* 竖线 + 节点 */}
              <div className="flex flex-col items-center">
                <StatusIcon status={step.status} />
                {!isLast && (
                  <div
                    className="w-px flex-1 min-h-6 transition-colors duration-500"
                    style={{
                      background: step.status === 'completed' ? '#4ade8040' : 'rgba(0,0,0,0.06)',
                    }}
                  />
                )}
              </div>

              {/* 内容 */}
              <div className={`flex-1 pb-6 ${isLast ? '' : ''}`}>
                <AgentCard
                  agent={step.agent}
                  status={step.status === 'completed' ? 'done' : step.status === 'running' ? 'working' : 'idle'}
                  output={isCurrent || step.status === 'completed' ? step.output : undefined}
                />

                {/* 运行中展开输出 */}
                {step.status === 'running' && step.output && (
                  <div
                    className="mt-2 p-3 rounded-lg text-xs leading-relaxed animate-pulse"
                    style={{ background: '#ffffff', color: '#64748b', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {step.output}
                    <span className="inline-block w-1.5 h-3 ml-0.5 rounded-sm animate-pulse" style={{ background: '#3b82f6' }} />
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
