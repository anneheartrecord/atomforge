import { useState, useRef, useCallback } from 'react';
import { RefreshCw, Monitor, Smartphone, Maximize2 } from 'lucide-react';

interface PreviewProps {
  html: string;
  title?: string;
}

type Device = 'desktop' | 'mobile';

export default function Preview({ html, title = 'Preview' }: PreviewProps) {
  const [device, setDevice] = useState<Device>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(f => !f);
  }, [isFullscreen]);

  const iframeWidth = device === 'mobile' ? '375px' : '100%';

  return (
    <div className="flex flex-col h-full" style={{ background: '#ffffff' }}>
      {/* ── 浏览器顶栏 ── */}
      <div
        className="flex items-center gap-3 px-4 h-11 shrink-0"
        style={{ background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        {/* 三色点 */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
        </div>

        {/* URL 栏 */}
        <div
          className="flex-1 flex items-center px-3 h-6 rounded-md text-[11px] truncate"
          style={{ background: '#ffffff', color: '#94a3b8', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <span style={{ color: '#333' }}>https://</span>
          <span style={{ color: '#64748b' }}>{title}.atomforge.dev</span>
        </div>

        {/* 工具按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDevice('desktop')}
            className="p-2 rounded-md transition-colors"
            style={{ background: device === 'desktop' ? '#f8fafc' : 'transparent', color: device === 'desktop' ? '#3b82f6' : '#555' }}
          >
            <Monitor size={14} />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className="p-2 rounded-md transition-colors"
            style={{ background: device === 'mobile' ? '#f8fafc' : 'transparent', color: device === 'mobile' ? '#3b82f6' : '#555' }}
          >
            <Smartphone size={14} />
          </button>
          <button onClick={handleRefresh} className="p-2 rounded-md transition-colors hover:bg-white/5" style={{ color: '#94a3b8' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={handleFullscreen} className="p-2 rounded-md transition-colors hover:bg-white/5" style={{ color: '#94a3b8' }}>
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* ── iframe 容器 ── */}
      <div className="flex-1 flex items-start justify-center overflow-auto p-0" style={{ background: '#0a0a0a' }}>
        <iframe
          key={refreshKey}
          ref={iframeRef}
          srcDoc={html}
          title={title}
          sandbox="allow-scripts allow-same-origin"
          className="border-0 h-full transition-all duration-300"
          style={{
            width: iframeWidth,
            maxWidth: '100%',
            background: '#fff',
            ...(device === 'mobile' ? { borderRadius: '12px', margin: '12px auto', boxShadow: '0 0 0 1px rgba(0,0,0,0.06)' } : {}),
          }}
        />
      </div>
    </div>
  );
}
