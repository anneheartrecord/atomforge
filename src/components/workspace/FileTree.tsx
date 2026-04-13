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
      className="flex flex-col w-48 shrink-0 overflow-y-auto"
      style={{ background: '#ffffff', borderRight: '1px solid rgba(0,0,0,0.06)' }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 h-9 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>Files</span>
        <button
          onClick={() => setIsAdding(true)}
          className="p-1 rounded hover:bg-white/5 transition-colors"
          style={{ color: '#64748b' }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* 文件列表 */}
      <div className="py-1">
        {fileNames.map(name => {
          const active = name === activeFile;
          return (
            <div
              key={name}
              onClick={() => onFileSelect(name)}
              className="flex items-center gap-2 px-4 py-2 cursor-pointer group transition-colors"
              style={{
                background: active ? '#f8fafc' : 'transparent',
                borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
              }}
            >
              <FileIcon name={name} />
              <span className="text-xs truncate flex-1" style={{ color: active ? '#0f172a' : '#888' }}>
                {name}
              </span>
              {onDeleteFile && (
                <button
                  onClick={e => { e.stopPropagation(); onDeleteFile(name); }}
                  className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity p-0.5"
                  style={{ color: '#f87171' }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}

        {/* 新建文件输入 */}
        {isAdding && (
          <div className="flex items-center gap-1 px-4 py-2">
            <File size={14} style={{ color: '#94a3b8' }} />
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false); }}
              onBlur={() => { if (newName.trim()) handleAdd(); else setIsAdding(false); }}
              placeholder="filename.ext"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-gray-700"
              style={{ color: '#0f172a' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
