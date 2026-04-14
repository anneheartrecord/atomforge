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

      <main style={{ maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 24, paddingRight: 24, paddingTop: 96, paddingBottom: 64 }}>
        {/* Title bar */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1
              style={{ color: 'var(--color-text-primary)', fontSize: 24, fontWeight: 700 }}
            >
              My Projects
            </h1>
            {isDemo && (
              <span style={{ background: 'rgba(251,191,36,0.15)', color: '#f59e0b', borderRadius: 9999, paddingLeft: 10, paddingRight: 10, paddingTop: 2, paddingBottom: 2, fontSize: 12, fontWeight: 500 }}>
                Demo Mode
              </span>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', cursor: 'pointer', alignItems: 'center', gap: 8, borderRadius: 9999, border: 'none', paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10, fontSize: 14, fontWeight: 600, color: '#fff', background: 'var(--color-primary)' }}
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)' }}>
            <div
              style={{
                background: 'rgba(66,103,255,0.10)',
                color: 'var(--color-primary)',
                marginBottom: 16,
                display: 'flex',
                width: 64,
                height: 64,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 16,
              }}
            >
              <FolderOpen size={28} />
            </div>
            <h3
              style={{ color: 'var(--color-text-primary)', marginBottom: 12, fontSize: 18, fontWeight: 600 }}
            >
              No projects yet
            </h3>
            <p
              style={{ color: 'var(--color-text-secondary)', marginBottom: 32, fontSize: 14 }}
            >
              Create your first project to get started
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{ display: 'flex', cursor: 'pointer', alignItems: 'center', gap: 8, borderRadius: 9999, border: 'none', paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10, fontSize: 14, fontWeight: 600, color: '#fff', background: 'var(--color-primary)' }}
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
