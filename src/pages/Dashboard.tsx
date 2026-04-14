import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Send } from 'lucide-react';
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
  const [quickInput, setQuickInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const quickInputRef = useRef<HTMLTextAreaElement>(null);

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
    // 将 project mode 传递给 workspace
    sessionStorage.setItem(`project_mode_${project.id}`, project.mode);
    navigate(`/workspace/${project.id}`);
  };

  // 快速创建：用户输入第一句话，自动创建 project 并跳转
  const handleQuickCreate = async () => {
    const trimmed = quickInput.trim();
    if (!trimmed || isCreating) return;
    setIsCreating(true);

    const projectName = trimmed.slice(0, 30);
    const defaultMode: WorkspaceMode = 'engineer';

    if (isDemo || !userId) {
      const newProject: Project = {
        id: crypto.randomUUID(),
        user_id: userId || 'demo',
        name: projectName,
        description: trimmed,
        files: {},
        preview_html: '',
        mode: defaultMode,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // 把第一句话存到 sessionStorage，workspace 加载后自动发送
      sessionStorage.setItem(`quick_prompt_${newProject.id}`, trimmed);
      navigate(`/workspace/${newProject.id}`);
      return;
    }

    try {
      const newProject = await supabaseService.createProject({
        user_id: userId,
        name: projectName,
        description: trimmed,
        files: {},
        preview_html: '',
        mode: defaultMode,
        status: 'active',
      });
      sessionStorage.setItem(`quick_prompt_${newProject.id}`, trimmed);
      navigate(`/workspace/${newProject.id}`);
    } catch {
      const newProject: Project = {
        id: crypto.randomUUID(),
        user_id: userId,
        name: projectName,
        description: trimmed,
        files: {},
        preview_html: '',
        mode: defaultMode,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      sessionStorage.setItem(`quick_prompt_${newProject.id}`, trimmed);
      navigate(`/workspace/${newProject.id}`);
    }
  };

  const handleQuickKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickCreate();
    }
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

        {/* 快速对话入口 */}
        <div style={{ marginBottom: 32, padding: 24, borderRadius: 16, background: 'rgba(66,103,255,0.04)', border: '1px solid rgba(66,103,255,0.12)' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 12 }}>
            描述你想构建的内容，AI 会自动为你生成代码
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <textarea
              ref={quickInputRef}
              value={quickInput}
              onChange={e => setQuickInput(e.target.value)}
              onKeyDown={handleQuickKeyDown}
              placeholder="例如：帮我做一个现代风格的个人博客首页..."
              rows={2}
              style={{
                flex: 1, padding: 14, borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)',
                background: '#fff', fontSize: 15, resize: 'none', outline: 'none',
                color: 'var(--color-text-primary)', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleQuickCreate}
              disabled={!quickInput.trim() || isCreating}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 48, height: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'var(--color-primary)', color: '#fff',
                opacity: (!quickInput.trim() || isCreating) ? 0.4 : 1,
                flexShrink: 0,
              }}
            >
              <Send size={18} />
            </button>
          </div>
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
