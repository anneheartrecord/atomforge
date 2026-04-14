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
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{ position: 'relative', width: '100%', maxWidth: 448, borderRadius: 24, padding: 36 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          style={{ position: 'absolute', top: 16, right: 16, display: 'flex', width: 32, height: 32, cursor: 'pointer', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--color-text-muted)' }}
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <h2
          style={{ color: 'var(--color-text-primary)', marginBottom: 24, fontSize: 20, fontWeight: 700 }}
        >
          New Project
        </h2>

        {/* Name */}
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Project name <span style={{ color: '#FF6B6B' }}>*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Awesome App"
          style={{
            width: '100%',
            marginBottom: 20,
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 12,
            paddingBottom: 12,
            fontSize: 14,
            outline: 'none',
            background: 'var(--color-bg-input)',
            color: 'var(--color-text-primary)',
          }}
        />

        {/* Description */}
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your project..."
          rows={3}
          style={{
            width: '100%',
            marginBottom: 20,
            resize: 'none',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 12,
            paddingBottom: 12,
            fontSize: 14,
            outline: 'none',
            background: 'var(--color-bg-input)',
            color: 'var(--color-text-primary)',
          }}
        />

        {/* Mode selector */}
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Mode
        </label>
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              style={{
                flex: 1,
                display: 'flex',
                cursor: 'pointer',
                flexDirection: 'column' as const,
                alignItems: 'center',
                gap: 4,
                borderRadius: 12,
                border: `1px solid ${mode === m.value ? m.color + '60' : 'var(--color-border)'}`,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 12,
                paddingBottom: 12,
                textAlign: 'center' as const,
                background: mode === m.value ? m.color + '15' : 'var(--color-bg-input)',
                color: mode === m.value ? m.color : 'var(--color-text-secondary)',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</span>
              <span style={{ fontSize: 12, opacity: 0.7 }}>{m.desc}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              cursor: 'pointer',
              borderRadius: 9999,
              border: '1px solid var(--color-border)',
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 10,
              paddingBottom: 10,
              fontSize: 14,
              fontWeight: 500,
              background: 'transparent',
              color: 'var(--color-text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            style={{
              flex: 1,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              borderRadius: 9999,
              border: 'none',
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 10,
              paddingBottom: 10,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: 'var(--color-primary)',
              opacity: name.trim() ? 1 : 0.4,
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
