import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    async function check() {
      // 1. Check Supabase session first
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Sync to localStorage for other components
          localStorage.setItem('atomforge_user', JSON.stringify({
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            avatar_url: session.user.user_metadata?.avatar_url,
          }));
          setAuthed(true);
          setChecking(false);
          return;
        }
      } catch {
        // Supabase not available, fall through
      }

      // 2. Fallback to localStorage (Demo mode)
      const stored = localStorage.getItem('atomforge_user');
      if (stored) {
        setAuthed(true);
      } else {
        navigate('/login', { replace: true });
      }
      setChecking(false);
    }

    check();
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--color-bg-dark)' }}>
        <div className="h-8 w-8 animate-spin rounded-full" style={{ border: '2px solid var(--color-border)', borderTopColor: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (!authed) return null;

  return <>{children}</>;
}
