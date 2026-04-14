import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogIn, LogOut, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email?: string; avatar_url?: string } | null>(null);

  useEffect(() => {
    // Check Supabase session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          avatar_url: session.user.user_metadata?.avatar_url,
        });
        return;
      }
      // Fallback to localStorage
      const stored = localStorage.getItem('atomforge_user');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = {
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          avatar_url: session.user.user_metadata?.avatar_url,
        };
        setUser(u);
        localStorage.setItem('atomforge_user', JSON.stringify(u));
      } else {
        setUser(null);
        localStorage.removeItem('atomforge_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('atomforge_user');
    setUser(null);
    navigate('/');
  };

  return (
    <header
      className="glass fixed top-0 left-0 right-0 z-50"
      style={{ height: 64 }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3b82f6" />
                <stop offset="0.5" stopColor="#a78bfa" />
                <stop offset="1" stopColor="#4ecdc4" />
              </linearGradient>
            </defs>
            <path
              d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z"
              stroke="url(#logo-grad)"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="16" cy="16" r="5" fill="url(#logo-grad)" />
          </svg>
          <span
            className="text-xl font-semibold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Atom<span className="gradient-text">Forge</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm no-underline transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </Link>

          <Link
            to="/docs"
            className="flex items-center gap-1.5 text-sm no-underline transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            <FileText size={16} />
            Docs
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                  style={{ border: '2px solid var(--color-border)' }}
                />
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {user.name}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 rounded-lg text-sm transition-colors cursor-pointer"
                style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', padding: '6px 10px' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-full text-sm font-medium no-underline transition-all duration-200 text-white"
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                padding: '10px 24px',
                height: 40,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-primary)')}
            >
              <LogIn size={16} />
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
