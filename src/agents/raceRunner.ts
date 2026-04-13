import type { RaceEntry } from '../types';
import { streamGenerateCode } from '../services/gemini';

/**
 * 并行发起多个 Gemini 请求（Race 模式）。
 * 同一 prompt 并行生成 count 份独立结果，通过 onUpdate 实时报告进度。
 * 使用流式生成，让每个条目的输出可以实时更新。
 */
export async function runRace(
  prompt: string,
  count: number = 3,
  onUpdate: (entries: RaceEntry[]) => void
): Promise<RaceEntry[]> {
  // 初始化条目
  const entries: RaceEntry[] = Array.from({ length: count }, (_, i) => ({
    id: `race-${Date.now()}-${i}`,
    prompt,
    output: '',
    status: 'pending' as const,
  }));

  onUpdate([...entries]);

  // 为每个条目创建独立的流式生成任务
  const tasks = entries.map(async (_entry, index) => {
    // 标记为运行中
    entries[index] = {
      ...entries[index],
      status: 'running',
      startedAt: new Date().toISOString(),
    };
    onUpdate([...entries]);

    try {
      const fullText = await streamGenerateCode(
        prompt,
        (chunk: string) => {
          entries[index] = {
            ...entries[index],
            output: entries[index].output + chunk,
          };
          onUpdate([...entries]);
        }
      );

      entries[index] = {
        ...entries[index],
        output: fullText,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };
    } catch (err) {
      entries[index] = {
        ...entries[index],
        output: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        completedAt: new Date().toISOString(),
      };
    }

    onUpdate([...entries]);
  });

  // 并行执行所有任务
  await Promise.allSettled(tasks);

  return entries;
}
