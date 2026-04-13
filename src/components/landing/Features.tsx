import { Users, Zap, Code2, GitBranch } from 'lucide-react';
import type { ReactNode } from 'react';

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Users size={24} />,
    title: 'Team Mode',
    description:
      'Agents collaborate in sequence — PM writes specs, designer creates layouts, engineer codes, QA tests. A real software team workflow.',
  },
  {
    icon: <Zap size={24} />,
    title: 'Race Mode',
    description:
      'Multiple agents tackle the same prompt in parallel. Compare outputs side-by-side and pick the best result instantly.',
  },
  {
    icon: <Code2 size={24} />,
    title: 'Live Code Preview',
    description:
      'See your app come to life in real time. Built-in Monaco editor with syntax highlighting and an instant preview sandbox.',
  },
  {
    icon: <GitBranch size={24} />,
    title: 'GitHub Integration',
    description:
      'Export generated projects directly to GitHub repositories. One click to push, share, and deploy.',
  },
];

export default function Features() {
  return (
    <section style={{ padding: '128px 32px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h2
          className="text-center font-bold"
          style={{ color: 'var(--color-text-primary)', fontSize: 36, marginBottom: 16 }}
        >
          Everything you need
        </h2>
        <p
          className="mx-auto max-w-lg text-center"
          style={{ color: 'var(--color-text-secondary)', fontSize: 16, lineHeight: 1.7, marginBottom: 56 }}
        >
          From ideation to production-ready code, AtomForge handles the entire
          development lifecycle.
        </p>

        <div className="features-grid">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 24,
                padding: 36,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              <div
                className="flex items-center justify-center rounded-xl"
                style={{
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  width: 48,
                  height: 48,
                  marginBottom: 24,
                }}
              >
                {feature.icon}
              </div>
              <h3
                className="font-semibold"
                style={{ color: 'var(--color-text-primary)', fontSize: 20, marginBottom: 12 }}
              >
                {feature.title}
              </h3>
              <p
                className="leading-relaxed"
                style={{ color: 'var(--color-text-secondary)', fontSize: 15, lineHeight: 1.75 }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
