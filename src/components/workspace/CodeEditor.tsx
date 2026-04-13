import { useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { X } from 'lucide-react';

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
}

// ══════════════════════════════════════════════════════════
export default function CodeEditor({ files, activeFile, onFileChange, onContentChange }: CodeEditorProps) {
  const language = useMemo(() => langFromFile(activeFile), [activeFile]);
  const content = files[activeFile] ?? '';

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0">
      {/* ── Tab Bar ── */}
      <div
        className="flex items-center h-10 shrink-0 overflow-x-auto"
        style={{ background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        {Object.keys(files).map(name => {
          const active = name === activeFile;
          return (
            <button
              key={name}
              onClick={() => onFileChange(name)}
              className="flex items-center gap-1.5 px-4 py-2 h-full text-xs shrink-0 transition-colors group"
              style={{
                background: active ? '#ffffff' : 'transparent',
                color: active ? '#0f172a' : '#666',
                borderRight: '1px solid rgba(255,255,255,0.04)',
                borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: fileIconColor(name) }} />
              {name}
              <X
                size={12}
                className="ml-1 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                onClick={e => { e.stopPropagation(); /* close tab logic */ }}
              />
            </button>
          );
        })}
      </div>

      {/* ── Monaco Editor ── */}
      <div className="flex-1 min-h-0">
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
