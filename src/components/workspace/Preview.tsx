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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff' }}>
      {/* ── 浏览器顶栏 ── */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 16, height: 44, flexShrink: 0, background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        {/* 三色点 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        </div>

        {/* URL 栏 */}
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, height: 24, borderRadius: 6, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: '#ffffff', color: '#94a3b8', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <span style={{ color: '#333' }}>https://</span>
          <span style={{ color: '#64748b' }}>{title}.atomforge.dev</span>
        </div>

        {/* 工具按钮 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setDevice('desktop')}
            style={{ padding: 8, borderRadius: 6, border: 'none', cursor: 'pointer', background: device === 'desktop' ? '#f8fafc' : 'transparent', color: device === 'desktop' ? '#3b82f6' : '#555' }}
          >
            <Monitor size={14} />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            style={{ padding: 8, borderRadius: 6, border: 'none', cursor: 'pointer', background: device === 'mobile' ? '#f8fafc' : 'transparent', color: device === 'mobile' ? '#3b82f6' : '#555' }}
          >
            <Smartphone size={14} />
          </button>
          <button onClick={handleRefresh} style={{ padding: 8, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', color: '#94a3b8' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={handleFullscreen} style={{ padding: 8, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', color: '#94a3b8' }}>
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* ── iframe 容器 ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto', padding: 0, background: '#0a0a0a' }}>
        {html.trim() ? (
          <iframe
            key={refreshKey}
            ref={iframeRef}
            srcDoc={html}
            title={title}
            sandbox="allow-scripts allow-same-origin"
            style={{
              border: 0,
              height: '100%',
              width: iframeWidth,
              maxWidth: '100%',
              background: '#fff',
              ...(device === 'mobile' ? { borderRadius: 12, margin: '12px auto', boxShadow: '0 0 0 1px rgba(0,0,0,0.06)' } : {}),
            }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', color: '#64748b', gap: 8 }}>
            <span style={{ fontSize: 32 }}>💬</span>
            <span style={{ fontSize: 14 }}>开始对话以生成代码</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Start chatting to generate code</span>
          </div>
        )}
      </div>
    </div>
  );
}
