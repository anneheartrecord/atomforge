import { useState } from 'react';
import { File, FileCode, FileText, Plus, Trash2 } from 'lucide-react';

// ── 文件图标 ─────────────────────────────────────────────
function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'sh', 'json', 'yaml', 'yml'];
  const textExts = ['md', 'txt', 'log'];

  const colorMap: Record<string, string> = {
    html: '#e34c26', css: '#264de4', js: '#f7df1e', ts: '#3178c6',
    json: '#facc15', md: '#888', py: '#3572A5',
  };
  const color = colorMap[ext] || '#666';

  if (codeExts.includes(ext)) return <FileCode size={14} style={{ color }} />;
  if (textExts.includes(ext)) return <FileText size={14} style={{ color }} />;
  return <File size={14} style={{ color }} />;
}

// ── Props ─────────────────────────────────────────────────
interface FileTreeProps {
  files: Record<string, string>;
  activeFile: string;
  onFileSelect: (name: string) => void;
  onAddFile?: (name: string) => void;
  onDeleteFile?: (name: string) => void;
}

// ══════════════════════════════════════════════════════════
export default function FileTree({ files, activeFile, onFileSelect, onAddFile, onDeleteFile }: FileTreeProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (trimmed && onAddFile) {
      onAddFile(trimmed);
      setNewName('');
      setIsAdding(false);
    }
  };

  const fileNames = Object.keys(files).sort();

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', width: 192, flexShrink: 0, overflowY: 'auto', background: '#ffffff', borderRight: '1px solid rgba(0,0,0,0.06)' }}
    >
      {/* 头部 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 12, paddingRight: 12, height: 36, flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#94a3b8' }}>Files</span>
        <button
          onClick={() => setIsAdding(true)}
          style={{ padding: 4, borderRadius: 4, border: 'none', cursor: 'pointer', background: 'transparent', color: '#64748b' }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* 文件列表 */}
      <div style={{ paddingTop: 4, paddingBottom: 4 }}>
        {fileNames.map(name => {
          const active = name === activeFile;
          return (
            <div
              key={name}
              onClick={() => onFileSelect(name)}
              className="group"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                cursor: 'pointer',
                background: active ? '#f8fafc' : 'transparent',
                borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
              }}
            >
              <FileIcon name={name} />
              <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: active ? '#0f172a' : '#888' }}>
                {name}
              </span>
              {onDeleteFile && (
                <button
                  onClick={e => { e.stopPropagation(); onDeleteFile(name); }}
                  className="opacity-0 group-hover:opacity-50 hover:!opacity-100"
                  style={{ padding: 2, border: 'none', background: 'transparent', cursor: 'pointer', color: '#f87171' }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}

        {/* 新建文件输入 */}
        {isAdding && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8 }}>
            <File size={14} style={{ color: '#94a3b8' }} />
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false); }}
              onBlur={() => { if (newName.trim()) handleAdd(); else setIsAdding(false); }}
              placeholder="filename.ext"
              style={{ flex: 1, background: 'transparent', fontSize: 12, outline: 'none', color: '#0f172a', border: 'none' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
