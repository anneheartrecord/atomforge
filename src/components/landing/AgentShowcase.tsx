import type { AgentConfig } from '../../types';

const agents: (Pick<AgentConfig, 'role' | 'name' | 'title' | 'description' | 'color' | 'avatar'>)[] = [
  {
    role: 'emma',
    name: 'Emma',
    avatar: '👩‍🎨',
    title: 'Product Manager',
    description: 'Breaks down requirements into clear specs, user stories, and acceptance criteria.',
    color: '#FF6B6B',
  },
  {
    role: 'bob',
    name: 'Bob',
    avatar: '🧑‍💻',
    title: 'Frontend Engineer',
    description: 'Crafts responsive UIs with React, Tailwind, and modern web standards.',
    color: '#4ECDC4',
  },
  {
    role: 'alex',
    name: 'Alex',
    avatar: '🤖',
    title: 'Full-Stack Architect',
    description: 'Designs system architecture, APIs, and database schemas end-to-end.',
    color: '#4267FF',
  },
  {
    role: 'luna',
    name: 'Luna',
    avatar: '✨',
    title: 'UI/UX Designer',
    description: 'Creates stunning visual designs, color palettes, and interaction patterns.',
    color: '#FFE66D',
  },
  {
    role: 'sarah',
    name: 'Sarah',
    avatar: '🔍',
    title: 'QA Engineer',
    description: 'Writes comprehensive tests, catches edge cases, and ensures code quality.',
    color: '#A78BFA',
  },
];

export default function AgentShowcase() {
  return (
    <section className="px-8 py-32" style={{ background: 'var(--color-bg-dark)' }}>
      <div className="mx-auto max-w-6xl">
        <h2
          className="text-center font-bold tracking-tight"
          style={{ color: 'var(--color-text-primary)', fontSize: 36, marginBottom: 16 }}
        >
          Meet the <span className="gradient-text">Agents</span>
        </h2>
        <p
          className="mx-auto max-w-lg text-center"
          style={{ color: 'var(--color-text-secondary)', fontSize: 16, lineHeight: 1.7, marginBottom: 56 }}
        >
          Each agent brings specialized expertise. Combine them in Team Mode or
          let them compete in Race Mode.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 24,
          }}
        >
          {agents.map((agent) => (
            <div
              key={agent.role}
              className="group cursor-default transition-all duration-300"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 24,
                padding: 32,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = `0 8px 32px ${agent.color}22`;
                e.currentTarget.style.borderColor = `${agent.color}44`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              {/* Avatar */}
              <div
                className="flex items-center justify-center rounded-2xl text-2xl"
                style={{ background: `${agent.color}18`, width: 56, height: 56, marginBottom: 20 }}
              >
                {agent.avatar}
              </div>

              {/* Name */}
              <h3
                className="font-semibold"
                style={{ color: agent.color, fontSize: 16, marginBottom: 6 }}
              >
                {agent.name}
              </h3>

              {/* Title */}
              <p
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}
              >
                {agent.title}
              </p>

              {/* Description */}
              <p
                className="leading-relaxed"
                style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.7 }}
              >
                {agent.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
