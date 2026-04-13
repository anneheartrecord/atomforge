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
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2
          className="mb-4 text-center text-3xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Everything you need
        </h2>
        <p
          className="mx-auto mb-14 max-w-lg text-center text-base"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          From ideation to production-ready code, AtomForge handles the entire
          development lifecycle.
        </p>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 24,
                padding: 32,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background: 'rgba(66,103,255,0.10)',
                  color: 'var(--color-primary)',
                }}
              >
                {feature.icon}
              </div>
              <h3
                className="mb-2 text-lg font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
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
