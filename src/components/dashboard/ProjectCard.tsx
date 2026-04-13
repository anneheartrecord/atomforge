import { Trash2, Clock } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  onDelete: (id: string) => void;
}

const modeBadgeColors: Record<Project['mode'], { bg: string; text: string }> = {
  engineer: { bg: 'rgba(66,103,255,0.15)', text: '#6366f1' },
  team: { bg: 'rgba(78,205,196,0.15)', text: '#4ECDC4' },
  race: { bg: 'rgba(255,107,107,0.15)', text: '#FF6B6B' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ProjectCard({ project, onClick, onDelete }: ProjectCardProps) {
  const badge = modeBadgeColors[project.mode];

  return (
    <div
      className="group relative cursor-pointer transition-all duration-300"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 24,
        padding: 28,
      }}
      onClick={() => onClick(project)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-hover)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(project.id);
        }}
        className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none opacity-0 transition-all duration-200 group-hover:opacity-100"
        style={{
          background: 'rgba(255,107,107,0.1)',
          color: '#FF6B6B',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,107,107,0.2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,107,107,0.1)')}
        title="Delete project"
      >
        <Trash2 size={14} />
      </button>

      {/* Project name */}
      <h3
        className="mb-2 truncate pr-8 text-base font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {project.name}
      </h3>

      {/* Description */}
      <p
        className="mb-5 line-clamp-2 text-sm leading-relaxed"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {project.description || 'No description'}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-3 py-1 text-xs font-medium capitalize"
          style={{ background: badge.bg, color: badge.text }}
        >
          {project.mode}
        </span>
        <span
          className="flex items-center gap-1 text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Clock size={12} />
          {timeAgo(project.updated_at)}
        </span>
      </div>
    </div>
  );
}
