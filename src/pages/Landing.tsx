import Header from '../components/layout/Header';
import Hero from '../components/landing/Hero';
import AgentShowcase from '../components/landing/AgentShowcase';
import Features from '../components/landing/Features';

export default function Landing() {
  return (
    <div style={{ background: 'var(--color-bg-dark)', minHeight: '100vh' }}>
      <Header />
      <Hero />
      <AgentShowcase />
      <Features />

      {/* Footer */}
      <footer
        className="px-6 py-12"
        style={{
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg-dark)',
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            © 2026 AtomForge. Built with AI.
          </span>
          <div className="flex gap-6">
            {['GitHub', 'Docs', 'Discord'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm no-underline transition-colors duration-200"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = 'var(--color-text-secondary)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'var(--color-text-muted)')
                }
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
