import { useState } from 'react';
import { X } from 'lucide-react';
import type { WorkspaceMode } from '../../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string; mode: WorkspaceMode }) => void;
}

const modes: { value: WorkspaceMode; label: string; desc: string; color: string }[] = [
  { value: 'engineer', label: 'Engineer', desc: 'Single AI agent', color: '#4267FF' },
  { value: 'team', label: 'Team', desc: 'Agents collaborate', color: '#4ECDC4' },
  { value: 'race', label: 'Race', desc: 'Agents compete', color: '#FF6B6B' },
];

export default function NewProjectModal({ isOpen, onClose, onCreate }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<WorkspaceMode>('engineer');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim(), mode });
    setName('');
    setDescription('');
    setMode('engineer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="glass relative w-full max-w-md"
        style={{ borderRadius: 24, padding: '36px 32px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none"
          style={{ background: 'transparent', color: 'var(--color-text-muted)' }}
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <h2
          className="mb-6 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          New Project
        </h2>

        {/* Name */}
        <label className="mb-1 block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Project name <span style={{ color: '#FF6B6B' }}>*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Awesome App"
          className="mb-5 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
          style={{
            background: 'var(--color-bg-input)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />

        {/* Description */}
        <label className="mb-1 block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your project..."
          rows={3}
          className="mb-5 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
          style={{
            background: 'var(--color-bg-input)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />

        {/* Mode selector */}
        <label className="mb-2 block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Mode
        </label>
        <div className="mb-6 flex gap-3">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className="flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-xl border px-3 py-3 text-center transition-all"
              style={{
                background:
                  mode === m.value ? m.color + '15' : 'var(--color-bg-input)',
                borderColor:
                  mode === m.value ? m.color + '60' : 'var(--color-border)',
                color:
                  mode === m.value ? m.color : 'var(--color-text-secondary)',
              }}
            >
              <span className="text-sm font-semibold">{m.label}</span>
              <span className="text-xs opacity-70">{m.desc}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-full border px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: 'transparent',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 cursor-pointer rounded-full border-none px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'var(--color-primary)' }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
