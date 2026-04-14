import { Check, Loader2, Trophy } from 'lucide-react';
import type { RaceEntry } from '../../types';

interface RaceViewProps {
  entries: RaceEntry[];
  onSelect: (id: string) => void;
}

// ── 简易 markdown 渲染 ─────────────────────────────────────
function renderSimpleMarkdown(text: string): string {
  let html = text
    // 转义 HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // 标题
    .replace(/^### (.+)$/gm, '<h3 style="margin:8px 0 4px;font-size:14px;font-weight:600">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="margin:10px 0 4px;font-size:16px;font-weight:600">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="margin:12px 0 6px;font-size:18px;font-weight:700">$1</h1>')
    // 代码块
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre style="background:#f1f5f9;padding:8px 12px;border-radius:6px;overflow-x:auto;font-size:12px;line-height:1.5"><code>$1</code></pre>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-size:12px">$1</code>')
    // 加粗
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 无序列表
    .replace(/^[*-] (.+)$/gm, '<li style="margin-left:16px;list-style:disc">$1</li>')
    // 有序列表
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:16px;list-style:decimal">$1</li>')
    // 段落（连续空行）
    .replace(/\n{2,}/g, '<br/><br/>');

  return html;
}

function isValidHtml(output: string): boolean {
  const trimmed = output.trim();
  return trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<HTML') || trimmed.startsWith('<!doctype');
}

export default function RaceView({ entries, onSelect }: RaceViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff' }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 16, height: 40, flexShrink: 0, fontSize: 12, fontWeight: 600, borderBottom: '1px solid rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.5)' }}
      >
        <Trophy size={14} style={{ color: '#FFE66D' }} />
        Race Mode — {entries.length} variants
      </div>

      {/* Race entries - 垂直堆叠 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.06)',
              minHeight: 300,
              flex: 1,
            }}
          >
            {/* Preview header - macOS dots */}
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 12, paddingRight: 12, height: 32, flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.06)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(0,0,0,0.4)' }}>
                  Variant {String.fromCharCode(65 + index)}
                </span>
              </div>
              {entry.status === 'running' && <Loader2 size={12} className="animate-spin" style={{ color: '#3b82f6' }} />}
              {entry.status === 'completed' && <Check size={12} style={{ color: '#4ade80' }} />}
            </div>

            {/* Preview content */}
            <div style={{ flex: 1, minHeight: 0 }}>
              {entry.status === 'running' ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <Loader2 size={24} className="animate-spin" style={{ color: '#3b82f6' }} />
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.3)' }}>Generating...</span>
                  </div>
                </div>
              ) : entry.status === 'completed' && entry.output ? (
                isValidHtml(entry.output) ? (
                  <iframe
                    srcDoc={entry.output}
                    title={`Variant ${String.fromCharCode(65 + index)}`}
                    sandbox="allow-scripts"
                    style={{ width: '100%', height: '100%', border: 0, background: '#fff' }}
                  />
                ) : (
                  <div
                    style={{ padding: 16, fontSize: 13, lineHeight: 1.7, color: '#334155', overflow: 'auto', height: '100%' }}
                    dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(entry.output) }}
                  />
                )
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.15)' }}>Waiting...</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingLeft: 12, paddingRight: 12, height: 40, flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <button
                onClick={() => onSelect(entry.id)}
                disabled={entry.status !== 'completed'}
                style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: entry.status === 'completed' ? 'pointer' : 'not-allowed', border: 0, background: '#3b82f6', color: '#fff', opacity: entry.status !== 'completed' ? 0.3 : 1 }}
              >
                <Check size={12} />
                Select
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
