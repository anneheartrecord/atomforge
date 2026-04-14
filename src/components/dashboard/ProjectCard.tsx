import { Trash2, Clock } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  onDelete: (id: string) => void;
}

const modeBadgeColors: Record<Project['mode'], { bg: string; text: string }> = {
  engineer: { bg: 'rgba(66,103,255,0.15)', text: '#3b82f6' },
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
      className="group"
      style={{
        position: 'relative',
        cursor: 'pointer',
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
        className="opacity-0 group-hover:opacity-100"
        style={{
          position: 'absolute',
          right: 16,
          top: 16,
          display: 'flex',
          width: 32,
          height: 32,
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          border: 'none',
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
        style={{ color: 'var(--color-text-primary)', marginBottom: 8, paddingRight: 32, fontSize: 16, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {project.name}
      </h3>

      {/* Description */}
      <p
        style={{ color: 'var(--color-text-secondary)', marginBottom: 20, fontSize: 14, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}
      >
        {project.description || 'No description'}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{ background: badge.bg, color: badge.text, borderRadius: 9999, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, fontSize: 12, fontWeight: 500, textTransform: 'capitalize' as const }}
        >
          {project.mode}
        </span>
        <span
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-muted)' }}
        >
          <Clock size={12} />
          {timeAgo(project.updated_at)}
        </span>
      </div>
    </div>
  );
}
