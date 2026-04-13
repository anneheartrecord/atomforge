import { useState, useCallback } from 'react';
import type { Project } from '../types';
import * as supabaseService from '../services/supabase';

interface UseProjectReturn {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  createProject: (
    project: Omit<Project, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<Project>;
  updateProject: (
    id: string,
    updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>
  ) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  loadProjects: (userId: string) => Promise<void>;
}

export function useProject(): UseProjectReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProjects = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const data = await supabaseService.getProjects(userId);
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProject = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await supabaseService.getProject(id);
      setCurrentProject(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(
    async (
      project: Omit<Project, 'id' | 'created_at' | 'updated_at'>
    ): Promise<Project> => {
      setLoading(true);
      try {
        const newProject = await supabaseService.createProject(project);
        setProjects((prev) => [newProject, ...prev]);
        setCurrentProject(newProject);
        return newProject;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateProject = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>
    ): Promise<Project> => {
      setLoading(true);
      try {
        const updated = await supabaseService.updateProject(id, updates);
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? updated : p))
        );
        if (currentProject?.id === id) {
          setCurrentProject(updated);
        }
        return updated;
      } finally {
        setLoading(false);
      }
    },
    [currentProject]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        await supabaseService.deleteProject(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (currentProject?.id === id) {
          setCurrentProject(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [currentProject]
  );

  return {
    projects,
    currentProject,
    loading,
    createProject,
    updateProject,
    deleteProject,
    loadProject,
    loadProjects,
  };
}
