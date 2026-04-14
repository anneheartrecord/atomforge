import { useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { X, FolderOpen, FolderClosed } from 'lucide-react';

// ── 文件类型 → 语言映射 ──────────────────────────────────
function langFromFile(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    html: 'html', htm: 'html',
    css: 'css', scss: 'scss', less: 'less',
    js: 'javascript', jsx: 'javascript', mjs: 'javascript',
    ts: 'typescript', tsx: 'typescriptreact',
    json: 'json', md: 'markdown',
    py: 'python', sh: 'shell', yaml: 'yaml', yml: 'yaml',
  };
  return map[ext] || 'plaintext';
}

// ── 文件 → 图标颜色 ─────────────────────────────────────
function fileIconColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    html: '#e34c26', css: '#264de4', js: '#f7df1e', ts: '#3178c6',
    json: '#facc15', md: '#888', py: '#3572A5', sh: '#4ade80',
  };
  return map[ext] || '#888';
}

// ── Props ─────────────────────────────────────────────────
interface CodeEditorProps {
  files: Record<string, string>;
  activeFile: string;
  onFileChange: (file: string) => void;
  onContentChange: (file: string, content: string) => void;
  onToggleFileTree?: () => void;
  showFileTree?: boolean;
}

// ══════════════════════════════════════════════════════════
export default function CodeEditor({ files, activeFile, onFileChange, onContentChange, onToggleFileTree, showFileTree }: CodeEditorProps) {
  const language = useMemo(() => langFromFile(activeFile), [activeFile]);
  const content = files[activeFile] ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0 }}>
      {/* ── Tab Bar ── */}
      <div
        style={{ display: 'flex', alignItems: 'center', height: 40, flexShrink: 0, overflowX: 'auto', background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        {/* FileTree toggle button */}
        {onToggleFileTree && (
          <button
            onClick={onToggleFileTree}
            title={showFileTree ? 'Hide file tree' : 'Show file tree'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: '100%', flexShrink: 0,
              border: 'none', borderRight: '1px solid rgba(0,0,0,0.06)',
              cursor: 'pointer', background: 'transparent', color: '#64748b',
            }}
          >
            {showFileTree ? <FolderOpen size={16} /> : <FolderClosed size={16} />}
          </button>
        )}
        {Object.keys(files).map(name => {
          const active = name === activeFile;
          return (
            <button
              key={name}
              onClick={() => onFileChange(name)}
              className="group"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                height: '100%',
                fontSize: 12,
                flexShrink: 0,
                border: 'none',
                cursor: 'pointer',
                background: active ? '#ffffff' : 'transparent',
                color: active ? '#0f172a' : '#666',
                borderRight: '1px solid rgba(255,255,255,0.04)',
                borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: fileIconColor(name) }} />
              {name}
              <X
                size={12}
                className="opacity-0 group-hover:opacity-50 hover:!opacity-100"
                style={{ marginLeft: 4 }}
                onClick={e => { e.stopPropagation(); /* close tab logic */ }}
              />
            </button>
          );
        })}
      </div>

      {/* ── Monaco Editor ── */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          theme="vs-dark"
          language={language}
          value={content}
          onChange={v => onContentChange(activeFile, v ?? '')}
          options={{
            fontSize: 13,
            lineHeight: 20,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'gutter',
            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace",
            fontLigatures: true,
            bracketPairColorization: { enabled: true },
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
