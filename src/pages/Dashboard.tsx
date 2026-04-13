import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen } from 'lucide-react';
import Header from '../components/layout/Header';
import ProjectCard from '../components/dashboard/ProjectCard';
import NewProjectModal from '../components/dashboard/NewProjectModal';
import * as supabaseService from '../services/supabase';
import type { Project, WorkspaceMode } from '../types';

// Mock 数据（Demo 模式 fallback）
const mockProjects: Project[] = [
  {
    id: '1',
    user_id: 'u1',
    name: 'E-Commerce Dashboard',
    description: 'A modern admin dashboard for an e-commerce platform with analytics, order management, and customer insights.',
    files: {},
    preview_html: '',
    mode: 'team',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: '2',
    user_id: 'u1',
    name: 'Portfolio Website',
    description: 'Personal portfolio with project showcase and blog.',
    files: {},
    preview_html: '',
    mode: 'engineer',
    status: 'active',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    user_id: 'u1',
    name: 'Chat Application',
    description: 'Real-time chat app with rooms, direct messages, and file sharing.',
    files: {},
    preview_html: '',
    mode: 'race',
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // 初始化：检查登录状态并拉取项目
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const user = await supabaseService.getCurrentUser();
        if (cancelled) return;

        if (user) {
          setUserId(user.id);
          const data = await supabaseService.getProjects(user.id);
          if (!cancelled) setProjects(data);
        } else {
          // 未登录，使用 Demo 模式
          setIsDemo(true);
          setProjects(mockProjects);
        }
      } catch {
        // Supabase 调用失败，fallback 到 Demo 模式
        if (!cancelled) {
          setIsDemo(true);
          setProjects(mockProjects);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async (data: { name: string; description: string; mode: WorkspaceMode }) => {
    if (isDemo || !userId) {
      // Demo 模式：本地创建
      const newProject: Project = {
        id: crypto.randomUUID(),
        user_id: userId || 'demo',
        name: data.name,
        description: data.description,
        files: {},
        preview_html: '',
        mode: data.mode,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProjects((prev) => [newProject, ...prev]);
      setShowModal(false);
      return;
    }

    try {
      const newProject = await supabaseService.createProject({
        user_id: userId,
        name: data.name,
        description: data.description,
        files: {},
        preview_html: '',
        mode: data.mode,
        status: 'active',
      });
      setProjects((prev) => [newProject, ...prev]);
    } catch {
      // Fallback：本地创建
      const newProject: Project = {
        id: crypto.randomUUID(),
        user_id: userId,
        name: data.name,
        description: data.description,
        files: {},
        preview_html: '',
        mode: data.mode,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProjects((prev) => [newProject, ...prev]);
    }
    setShowModal(false);
  };

  const handleDelete = async (projectId: string) => {
    // 乐观删除：先从 UI 移除
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    if (!isDemo) {
      try {
        await supabaseService.deleteProject(projectId);
      } catch {
        // 删除失败时不回滚，因为 Demo 模式下本来就没有远端数据
        console.error('Failed to delete project from Supabase');
      }
    }
  };

  const handleClick = (project: Project) => {
    navigate(`/workspace/${project.id}`);
  };

  return (
    <div style={{ background: 'var(--color-bg-dark)', minHeight: '100vh' }}>
      <Header />

      <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">
        {/* Title bar */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              My Projects
            </h1>
            {isDemo && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'rgba(251,191,36,0.15)', color: '#f59e0b' }}>
                Demo Mode
              </span>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex cursor-pointer items-center gap-2 rounded-full border-none px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {projects.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={handleClick}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center py-32">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: 'rgba(66,103,255,0.10)',
                color: 'var(--color-primary)',
              }}
            >
              <FolderOpen size={28} />
            </div>
            <h3
              className="mb-2 text-lg font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              No projects yet
            </h3>
            <p
              className="mb-6 text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Create your first project to get started
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex cursor-pointer items-center gap-2 rounded-full border-none px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-primary)' }}
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
        )}
      </main>

      <NewProjectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
