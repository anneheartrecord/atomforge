import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('atomforge_user');
    if (user) {
      setAuthed(true);
    } else {
      navigate('/login', { replace: true });
    }
    setChecking(false);
  }, [navigate]);

  if (checking) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: 'var(--color-bg-dark)' }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full"
          style={{
            border: '2px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
          }}
        />
      </div>
    );
  }

  if (!authed) return null;

  return <>{children}</>;
}
