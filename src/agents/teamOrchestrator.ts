import type { AgentRole, TeamStep } from '../types';
import { AGENTS } from './types';
import { generateWithRole } from '../services/gemini';

const PIPELINE_ORDER: AgentRole[] = ['emma', 'bob', 'alex', 'luna', 'sarah'];

/**
 * 按顺序执行团队流水线：Emma → Bob → Alex → Luna → Sarah
 * 每一步将上一步的输出作为下一步的上下文输入
 */
export async function runTeamPipeline(
  userPrompt: string,
  onStepUpdate: (step: TeamStep) => void,
  onChunk?: (text: string) => void,
): Promise<TeamStep[]> {
  const steps: TeamStep[] = PIPELINE_ORDER.map((role) => {
    const agent = AGENTS.find((a) => a.role === role)!;
    return {
      agent,
      status: 'pending' as const,
      output: '',
    };
  });

  // 通知初始状态
  steps.forEach((step) => onStepUpdate(step));

  let previousOutput = '';

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // 标记当前步骤为运行中
    step.status = 'running';
    step.startedAt = new Date().toISOString();
    onStepUpdate({ ...step });

    try {
      // 构建用户 prompt：第一步用原始 prompt，后续步骤附带上一步的输出
      const contextualPrompt =
        i === 0
          ? userPrompt
          : `Original user request: ${userPrompt}\n\nPrevious step (${steps[i - 1].agent.name} - ${steps[i - 1].agent.title}) output:\n${previousOutput}`;

      // 使用带角色的生成函数
      const output = await generateWithRole(
        step.agent.systemPrompt,
        contextualPrompt,
        // 只在当前步骤转发 chunk 回调
        onChunk
          ? (text: string) => {
              step.output += text;
              onStepUpdate({ ...step });
              onChunk(text);
            }
          : undefined,
      );

      // 如果没有 onChunk，手动设置 output（generateWithRole 非流式时直接返回完整文本）
      if (!onChunk) {
        step.output = output;
      }

      step.status = 'completed';
      step.completedAt = new Date().toISOString();
      onStepUpdate({ ...step });

      previousOutput = step.output || output;
    } catch (error) {
      step.status = 'error';
      step.output =
        error instanceof Error ? error.message : 'Unknown error occurred';
      step.completedAt = new Date().toISOString();
      onStepUpdate({ ...step });

      // 出错后终止流水线
      break;
    }
  }

  return steps;
}
