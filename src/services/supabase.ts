import { supabase } from '../lib/supabaseClient';
import type { Project, Conversation, Version } from '../types';

// ======================== Projects ========================

export async function getProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  return data as Project[];
}

export async function getProject(id: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch project: ${error.message}`);
  return data as Project;
}

export async function createProject(
  project: Omit<Project, 'id' | 'created_at' | 'updated_at'>,
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return data as Project;
}

export async function updateProject(
  id: string,
  updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>,
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update project: ${error.message}`);
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) throw new Error(`Failed to delete project: ${error.message}`);
}

// ======================== Conversations ========================

export async function getConversations(
  projectId: string,
): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error)
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  return data as Conversation[];
}

export async function addConversation(
  conversation: Omit<Conversation, 'id' | 'created_at'>,
): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert(conversation)
    .select()
    .single();

  if (error) throw new Error(`Failed to add conversation: ${error.message}`);
  return data as Conversation;
}

// ======================== Versions ========================

export async function getVersions(projectId: string): Promise<Version[]> {
  const { data, error } = await supabase
    .from('versions')
    .select('*')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false });

  if (error) throw new Error(`Failed to fetch versions: ${error.message}`);
  return data as Version[];
}

export async function createVersion(
  version: Omit<Version, 'id' | 'created_at'>,
): Promise<Version> {
  const { data, error } = await supabase
    .from('versions')
    .insert(version)
    .select()
    .single();

  if (error) throw new Error(`Failed to create version: ${error.message}`);
  return data as Version;
}
