import { create } from 'zustand';
import type { User, Project, ChatMessage, WorkspaceMode, TeamStep, RaceEntry } from '../types';

interface AppState {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Projects
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // Chat
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string) => void;

  // Workspace
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
  activeFile: string;
  setActiveFile: (file: string) => void;

  // Team Mode
  teamSteps: TeamStep[];
  setTeamSteps: (steps: TeamStep[]) => void;
  isTeamRunning: boolean;
  setIsTeamRunning: (running: boolean) => void;

  // Race Mode
  raceEntries: RaceEntry[];
  setRaceEntries: (entries: RaceEntry[]) => void;
  isRaceRunning: boolean;
  setIsRaceRunning: (running: boolean) => void;

  // UI
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),

  // Projects
  projects: [],
  setProjects: (projects) => set({ projects }),
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),

  // Chat
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = { ...messages[messages.length - 1], content, isStreaming: false };
      }
      return { messages };
    }),

  // Workspace
  mode: 'engineer',
  setMode: (mode) => set({ mode }),
  activeFile: 'index.html',
  setActiveFile: (file) => set({ activeFile: file }),

  // Team Mode
  teamSteps: [],
  setTeamSteps: (steps) => set({ teamSteps: steps }),
  isTeamRunning: false,
  setIsTeamRunning: (running) => set({ isTeamRunning: running }),

  // Race Mode
  raceEntries: [],
  setRaceEntries: (entries) => set({ raceEntries: entries }),
  isRaceRunning: false,
  setIsRaceRunning: (running) => set({ isRaceRunning: running }),

  // UI
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
