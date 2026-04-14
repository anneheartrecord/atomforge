import { useState } from 'react';
import { Check, Loader2, Trophy, Eye } from 'lucide-react';
import type { RaceEntry } from '../../types';

interface RaceViewProps {
  entries: RaceEntry[];
  onSelect: (id: string) => void;
}

export default function RaceView({ entries, onSelect }: RaceViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff' }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 16, height: 40, flexShrink: 0, fontSize: 12, fontWeight: 600, borderBottom: '1px solid rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.5)' }}
      >
        <Trophy size={14} style={{ color: '#FFE66D' }} />
        Race Mode — {entries.length} variants
      </div>

      {/* Race entries */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: `repeat(${Math.min(entries.length, 3)}, 1fr)` }}>
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 16,
                overflow: 'hidden',
                background: '#ffffff',
                border: expandedId === entry.id ? '1px solid #3b82f6' : '1px solid rgba(0,0,0,0.06)',
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

              {/* Preview iframe */}
              <div style={{ height: expandedId === entry.id ? 400 : 200, transition: 'height 0.3s ease' }}>
                {entry.status === 'running' ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <Loader2 size={24} className="animate-spin" style={{ color: '#3b82f6' }} />
                      <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.3)' }}>Generating...</span>
                    </div>
                  </div>
                ) : entry.status === 'completed' ? (
                  <iframe
                    srcDoc={entry.output}
                    title={`Variant ${String.fromCharCode(65 + index)}`}
                    sandbox="allow-scripts"
                    style={{ width: '100%', height: '100%', border: 0, background: '#fff' }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.15)' }}>Waiting...</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 12, paddingRight: 12, height: 40, flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <button
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, borderRadius: 6, fontSize: 12, cursor: 'pointer', border: 0, background: 'rgba(0,0,0,0.04)', color: 'rgba(0,0,0,0.5)' }}
                >
                  <Eye size={12} />
                  {expandedId === entry.id ? 'Collapse' : 'Expand'}
                </button>
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
    </div>
  );
}
