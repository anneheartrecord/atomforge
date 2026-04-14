import { supabase } from '../lib/supabaseClient';
import type { Project, Conversation, Version, Artifact } from '../types';

// ======================== Auth Helper ========================

export async function getCurrentUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
}

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
  pid: string,
): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('pid', pid)
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

export async function getVersions(pid: string): Promise<Version[]> {
  const { data, error } = await supabase
    .from('versions')
    .select('*')
    .eq('pid', pid)
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

// ======================== Artifacts ========================

export async function getArtifacts(pid: string): Promise<Artifact[]> {
  const { data, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('pid', pid)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch artifacts: ${error.message}`);
  return data as Artifact[];
}

export async function saveArtifact(
  pid: string,
  filename: string,
  content: string,
  filetype: string = 'text',
): Promise<Artifact> {
  const { data, error } = await supabase
    .from('artifacts')
    .insert({
      pid,
      filename,
      content,
      filetype,
      size_bytes: new Blob([content]).size,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save artifact: ${error.message}`);
  return data as Artifact;
}

export async function deleteArtifact(id: string): Promise<void> {
  const { error } = await supabase.from('artifacts').delete().eq('id', id);

  if (error) throw new Error(`Failed to delete artifact: ${error.message}`);
}

// ======================== User Memory ========================

export interface UserMemory {
  id: string;
  user_id: string;
  category: string; // 'preference' | 'fact' | 'style' | 'context'
  content: string;
  created_at: string;
}

export async function getMemories(userId: string): Promise<UserMemory[]> {
  const { data, error } = await supabase
    .from('user_memory')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return []; // 表可能不存在，静默失败
  return (data || []) as UserMemory[];
}

export async function addMemory(userId: string, category: string, content: string): Promise<void> {
  await supabase.from('user_memory').insert({ user_id: userId, category, content }).select();
}

export async function deleteMemory(id: string): Promise<void> {
  await supabase.from('user_memory').delete().eq('id', id);
}
