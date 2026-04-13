import type { AgentConfig } from '../../types';

const agents: (Pick<AgentConfig, 'role' | 'name' | 'title' | 'description' | 'color'> & { avatar: string })[] = [
  {
    role: 'emma',
    name: 'Emma',
    avatar: '/avatars/emma.svg',
    title: 'Product Manager',
    description: 'Breaks down requirements into clear specs, user stories, and acceptance criteria.',
    color: '#f472b6',
  },
  {
    role: 'bob',
    name: 'Bob',
    avatar: '/avatars/bob.svg',
    title: 'Architect',
    description: 'Designs system architecture, APIs, and database schemas end-to-end.',
    color: '#06b6d4',
  },
  {
    role: 'alex',
    name: 'Alex',
    avatar: '/avatars/alex.svg',
    title: 'Engineer',
    description: 'Writes production-ready code across the full stack with modern best practices.',
    color: '#3b82f6',
  },
  {
    role: 'luna',
    name: 'Luna',
    avatar: '/avatars/luna.svg',
    title: 'Designer',
    description: 'Creates stunning visual designs, color palettes, and interaction patterns.',
    color: '#f59e0b',
  },
  {
    role: 'sarah',
    name: 'Sarah',
    avatar: '/avatars/sarah.svg',
    title: 'QA Engineer',
    description: 'Reviews code quality, catches edge cases, and ensures everything works.',
    color: '#8b5cf6',
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

        <div className="agents-grid">
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
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `2px solid ${agent.color}33`,
                  marginBottom: 20,
                }}
              >
                <img src={agent.avatar} alt={agent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
