import { Link } from 'react-router-dom';
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
        style={{
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg-dark)',
          padding: '48px 32px',
        }}
      >
        <div style={{ maxWidth: 1152, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 500 }}>
            © 2026 AtomForge. Built with AI.
          </span>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link to="/docs" style={{ color: 'var(--color-text-muted)', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
              Documentation
            </Link>
            <a href="https://github.com/anneheartrecord/atomforge" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-muted)', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
