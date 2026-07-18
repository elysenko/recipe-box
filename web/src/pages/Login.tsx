import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/recipes';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      setError('Login failed. Check your email and password.');
    } finally {
      setBusy(false);
    }
  }

  function fill(role: 'admin' | 'user') {
    setEmail(role === 'admin' ? 'admin@demo.test' : 'user@demo.test');
    setPassword('demo-password');
  }

  return (
    <div className="auth-wrap">
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: '2.6rem' }}>🍲</div>
        <h1>Recipe Box</h1>
        <p className="muted">Your household’s recipes & weekly menu</p>
      </div>
      <div className="card">
        {error && <div className="notice error" data-testid="login-message">{error}</div>}
        <form onSubmit={submit} data-testid="login-form">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              data-testid="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@household.test"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              data-testid="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="btn block" type="submit" disabled={busy} data-testid="login-submit">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="auth-demo muted">
          Try a demo account:{' '}
          <button type="button" onClick={() => fill('admin')}>admin@demo.test</button>
          {' · '}
          <button type="button" onClick={() => fill('user')}>user@demo.test</button>
        </div>
        <hr className="divider" />
        <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
          Need an account? <Link to="/signup" style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
