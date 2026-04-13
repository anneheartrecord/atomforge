import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const handleStart = () => {
    // Save prompt to sessionStorage so workspace can pick it up
    if (prompt.trim()) {
      sessionStorage.setItem('atomforge_initial_prompt', prompt.trim());
    }
    navigate('/dashboard');
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-8 pt-20">
      {/* 背景光效 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(66,103,255,0.12) 0%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 40% 30% at 60% 50%, rgba(167,139,250,0.06) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div
          className="glass inline-flex items-center gap-3 rounded-full px-6 py-2.5 text-sm tracking-wide"
          style={{ color: 'var(--color-text-secondary)', marginBottom: 48 }}
        >
          <Sparkles size={15} style={{ color: 'var(--color-primary)' }} />
          AI-powered code generation platform
        </div>

        {/* 大标题 — 超大字号 + 充足行高 */}
        <h1
          className="gradient-text font-bold tracking-tight"
          style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.1, marginBottom: 32 }}
        >
          Build anything with
          <br />
          AI agents
        </h1>

        {/* 副标题 — 更大字号 + 更宽行距 */}
        <p
          className="mx-auto max-w-2xl"
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: 18,
            lineHeight: 1.8,
            marginBottom: 56,
            letterSpacing: '0.2px',
          }}
        >
          Describe your idea and let a team of specialized AI agents turn it into
          production-ready code — from architecture to deployment.
        </p>

        {/* 大输入框 — Atoms 风格 64px 高 */}
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
            style={{
              background: 'var(--color-primary)',
              border: 'none',
              height: 52,
              padding: '0 28px',
              fontSize: 15,
            }}
          >
            Start Building
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
