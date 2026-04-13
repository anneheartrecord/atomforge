// Core types for AtomForge

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  files: Record<string, string>;
  preview_html: string;
  mode: 'engineer' | 'team' | 'race';
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  project_id: string;
  role: AgentRole | 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Version {
  id: string;
  project_id: string;
  version_number: number;
  files: Record<string, string>;
  preview_html: string;
  created_at: string;
}

export type AgentRole = 'emma' | 'bob' | 'alex' | 'luna' | 'sarah';

export interface AgentConfig {
  role: AgentRole;
  name: string;
  title: string;
  description: string;
  color: string;
  avatar: string; // emoji
  systemPrompt: string;
}

export type WorkspaceMode = 'engineer' | 'team' | 'race';

export interface TeamStep {
  agent: AgentConfig;
  status: 'pending' | 'running' | 'completed' | 'error';
  output: string;
  startedAt?: string;
  completedAt?: string;
}

export interface RaceEntry {
  id: string;
  prompt: string;
  output: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startedAt?: string;
  completedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | AgentRole;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}
