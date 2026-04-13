import { useState, useCallback } from 'react';
import type { TeamStep } from '../types';
import { runTeamPipeline } from '../agents/teamOrchestrator';

interface UseTeamModeReturn {
  steps: TeamStep[];
  isRunning: boolean;
  runTeam: (prompt: string) => Promise<TeamStep[]>;
  reset: () => void;
}

export function useTeamMode(): UseTeamModeReturn {
  const [steps, setSteps] = useState<TeamStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTeam = useCallback(async (prompt: string): Promise<TeamStep[]> => {
    setIsRunning(true);
    setSteps([]);

    try {
      const finalSteps = await runTeamPipeline(
        prompt,
        (updatedStep) => {
          setSteps((prev) => {
            const idx = prev.findIndex(
              (s) => s.agent.role === updatedStep.agent.role
            );
            if (idx === -1) {
              return [...prev, updatedStep];
            }
            const next = [...prev];
            next[idx] = updatedStep;
            return next;
          });
        }
      );

      setSteps(finalSteps);
      return finalSteps;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSteps([]);
    setIsRunning(false);
  }, []);

  return { steps, isRunning, runTeam, reset };
}
