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

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* Badge */}
        <div
          className="glass mb-10 inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
          AI-powered code generation platform
        </div>

        {/* 大标题 */}
        <h1
          className="gradient-text mb-8 text-6xl font-bold leading-tight tracking-tight"
          style={{ lineHeight: 1.15 }}
        >
          Build anything with
          <br />
          AI agents
        </h1>

        {/* 副标题 */}
        <p
          className="mx-auto mb-14 max-w-xl text-lg leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Describe your idea and let a team of specialized AI agents turn it into
          production-ready code — from architecture to deployment.
        </p>

        {/* 大输入框 */}
        <div
          className="glass mx-auto flex max-w-2xl items-center gap-3 p-2.5"
          style={{ borderRadius: 40, height: 68 }}
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="Describe what you want to build..."
            className="h-full flex-1 border-none bg-transparent px-6 text-base outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
          <button
            onClick={handleStart}
            className="flex h-12 cursor-pointer items-center gap-2.5 rounded-full px-7 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'var(--color-primary)',
              border: 'none',
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
