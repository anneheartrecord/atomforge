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
    <div className="flex flex-col h-full" style={{ background: '#ffffff' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 h-10 shrink-0 text-xs font-semibold"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.5)' }}
      >
        <Trophy size={14} style={{ color: '#FFE66D' }} />
        Race Mode — {entries.length} variants
      </div>

      {/* Race entries */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(entries.length, 3)}, 1fr)` }}>
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex flex-col rounded-2xl overflow-hidden transition-all"
              style={{
                background: '#ffffff',
                border: expandedId === entry.id ? '1px solid #3b82f6' : '1px solid rgba(0,0,0,0.06)',
              }}
            >
              {/* Preview header - macOS dots */}
              <div
                className="flex items-center justify-between px-3 h-8 shrink-0"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#ff5f57' }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: '#febc2e' }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: '#28c840' }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>
                    Variant {String.fromCharCode(65 + index)}
                  </span>
                </div>
                {entry.status === 'running' && <Loader2 size={12} className="animate-spin" style={{ color: '#3b82f6' }} />}
                {entry.status === 'completed' && <Check size={12} style={{ color: '#4ade80' }} />}
              </div>

              {/* Preview iframe */}
              <div style={{ height: expandedId === entry.id ? '400px' : '200px', transition: 'height 0.3s ease' }}>
                {entry.status === 'running' ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={24} className="animate-spin" style={{ color: '#3b82f6' }} />
                      <span className="text-xs" style={{ color: 'rgba(0,0,0,0.3)' }}>Generating...</span>
                    </div>
                  </div>
                ) : entry.status === 'completed' ? (
                  <iframe
                    srcDoc={entry.output}
                    title={`Variant ${String.fromCharCode(65 + index)}`}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts"
                    style={{ background: '#fff' }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-xs" style={{ color: 'rgba(0,0,0,0.15)' }}>Waiting...</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between px-3 h-10 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <button
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs cursor-pointer border-0"
                  style={{ background: 'rgba(0,0,0,0.04)', color: 'rgba(0,0,0,0.5)' }}
                >
                  <Eye size={12} />
                  {expandedId === entry.id ? 'Collapse' : 'Expand'}
                </button>
                <button
                  onClick={() => onSelect(entry.id)}
                  disabled={entry.status !== 'completed'}
                  className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium cursor-pointer border-0 disabled:opacity-30"
                  style={{ background: '#3b82f6', color: '#0f172a' }}
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
