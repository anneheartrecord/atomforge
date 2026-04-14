import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 33.4 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.2-2.7-.4-3.9z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 15.6 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.2-2.7-.4-3.9z"/>
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard' },
      });
      if (error) throw error;
    } catch {
      // Fallback: Demo mode
      localStorage.setItem('atomforge_user', JSON.stringify({ name: 'Demo User', email: 'demo@atomforge.dev' }));
      navigate('/dashboard');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: email.split('@')[0] } },
        });
        if (error) throw error;
        // If auto-confirm is enabled, user is logged in immediately
        if (data.session) {
          localStorage.setItem('atomforge_user', JSON.stringify({ name: email.split('@')[0], email }));
          navigate('/dashboard');
        } else {
          setMessage('Check your email to confirm your account, then sign in.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          localStorage.setItem('atomforge_user', JSON.stringify({
            name: data.user.user_metadata?.full_name || email.split('@')[0],
            email,
            avatar_url: data.user.user_metadata?.avatar_url,
          }));
        }
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    localStorage.setItem('atomforge_user', JSON.stringify({ name: 'Demo User', email: 'demo@atomforge.dev' }));
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: '#fafbff' }}>
      <div className="pointer-events-none" style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 50% 40% at 50% 40%, rgba(59,130,246,0.05) 0%, transparent 70%)' }} />

      <div className="glass" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 384, borderRadius: 24, padding: '48px 36px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="gradient-text" style={{ fontSize: 28, fontWeight: 700 }}>AtomForge</span>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 8 }}>
            {isSignUp ? 'Create your account' : 'Sign in to start building'}
          </p>
        </div>

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleSignIn}
          style={{
            display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 12,
            borderRadius: 9999, border: '1px solid var(--color-border)', padding: '12px 24px',
            background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)',
            fontSize: 14, fontWeight: 500, cursor: 'pointer', height: 48,
          }}
        >
          <GoogleIcon />
          Sign in with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0', color: 'var(--color-text-muted)' }}>
          <div style={{ height: 1, flex: 1, background: 'var(--color-border)' }} />
          <span style={{ fontSize: 12 }}>or continue with email</span>
          <div style={{ height: 1, flex: 1, background: 'var(--color-border)' }} />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              style={{
                width: '100%', height: 48, borderRadius: 12, border: '1px solid var(--color-border)',
                background: 'var(--color-bg-input)', color: 'var(--color-text-primary)',
                fontSize: 14, paddingLeft: 44, paddingRight: 16, outline: 'none',
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{
                width: '100%', height: 48, borderRadius: 12, border: '1px solid var(--color-border)',
                background: 'var(--color-bg-input)', color: 'var(--color-text-primary)',
                fontSize: 14, paddingLeft: 44, paddingRight: 16, outline: 'none',
              }}
            />
          </div>

          {error && <p style={{ color: 'var(--color-error)', fontSize: 13, margin: 0 }}>{error}</p>}
          {message && <p style={{ color: 'var(--color-success)', fontSize: 13, margin: 0 }}>{message}</p>}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%', height: 48, borderRadius: 9999, border: 'none',
              background: 'var(--color-primary)', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle sign up / sign in */}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', marginTop: 20 }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
            style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        {/* Demo mode */}
        <button
          onClick={handleDemoLogin}
          style={{
            width: '100%', marginTop: 16, padding: '10px 0', borderRadius: 9999,
            border: '1px dashed var(--color-border)', background: 'transparent',
            color: 'var(--color-text-muted)', fontSize: 13, cursor: 'pointer',
          }}
        >
          Skip — Try Demo Mode
        </button>

        {/* Back to home */}
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, fontSize: 14, color: 'var(--color-text-muted)', textDecoration: 'none' }}
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
      </div>
    </div>
  );
}
