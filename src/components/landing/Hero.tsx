import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const agents = [
  { name: 'Emma', title: 'Product Manager', avatar: '/avatars/emma.svg', color: '#f472b6' },
  { name: 'Bob', title: 'Architect', avatar: '/avatars/bob.svg', color: '#06b6d4' },
  { name: 'Alex', title: 'Engineer', avatar: '/avatars/alex.svg', color: '#3b82f6' },
  { name: 'Luna', title: 'Designer', avatar: '/avatars/luna.svg', color: '#f59e0b' },
  { name: 'Sarah', title: 'QA Engineer', avatar: '/avatars/sarah.svg', color: '#8b5cf6' },
];

export default function Hero() {
  const [prompt, setPrompt] = useState('');
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleStart = () => {
    if (prompt.trim()) {
      sessionStorage.setItem('atomforge_initial_prompt', prompt.trim());
    }
    navigate('/dashboard');
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-8 pt-20" style={{ background: '#fafbff' }}>
      {/* 背景光效 */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 40% 30% at 60% 50%, rgba(139,92,246,0.04) 0%, transparent 60%)' }} />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Agent 圆形头像 — 标题上方 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 40 }}>
          {agents.map((agent, i) => (
            <div
              key={agent.name}
              onMouseEnter={() => setHoveredAgent(i)}
              onMouseLeave={() => setHoveredAgent(null)}
              style={{ position: 'relative', cursor: 'default' }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `3px solid ${hoveredAgent === i ? agent.color : '#e2e8f0'}`,
                  transition: 'all 0.3s ease',
                  transform: hoveredAgent === i ? 'scale(1.15) translateY(-4px)' : 'scale(1)',
                  boxShadow: hoveredAgent === i ? `0 8px 24px ${agent.color}33` : 'none',
                }}
              >
                <img src={agent.avatar} alt={agent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Tooltip */}
              {hoveredAgent === i && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -36,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#0f172a',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                  }}
                >
                  {agent.name} · {agent.title}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Badge */}
        <div
          className="glass inline-flex items-center gap-3 rounded-full px-6 py-2.5 text-sm tracking-wide"
          style={{ color: 'var(--color-text-secondary)', marginBottom: 48 }}
        >
          <Sparkles size={15} style={{ color: 'var(--color-primary)' }} />
          AI-powered code generation platform
        </div>

        {/* 大标题 */}
        <h1
          className="gradient-text font-bold tracking-tight"
          style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.1, marginBottom: 32 }}
        >
          Build anything with
          <br />
          AI agents
        </h1>

        {/* 副标题 */}
        <p
          className="mx-auto max-w-2xl"
          style={{ color: 'var(--color-text-secondary)', fontSize: 18, lineHeight: 1.8, marginBottom: 56, letterSpacing: '0.2px' }}
        >
          Describe your idea and let a team of specialized AI agents turn it into
          production-ready code — from architecture to deployment.
        </p>

        {/* 大输入框 */}
        <div
          className="glass mx-auto flex max-w-2xl items-center gap-4"
          style={{ borderRadius: 40, height: 72, padding: '8px 8px 8px 28px' }}
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="Describe what you want to build..."
            className="h-full flex-1 border-none bg-transparent text-base outline-none"
            style={{ color: 'var(--color-text-primary)', fontSize: 16, padding: 0 }}
          />
          <button
            onClick={handleStart}
            className="flex shrink-0 cursor-pointer items-center gap-3 rounded-full text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]"
            style={{ background: 'var(--color-primary)', border: 'none', height: 52, padding: '0 28px', fontSize: 15 }}
          >
            Start Building
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
