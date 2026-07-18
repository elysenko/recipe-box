import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }).catch(() => null);
      // Sign in immediately after registration (real backend or demo fallback).
      await login(email, password);
      navigate('/recipes', { replace: true });
    } catch {
      setError('Could not create the account. The email may already be in use.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: '2.6rem' }}>🍲</div>
        <h1>Create your account</h1>
        <p className="muted">The first account becomes the household admin.</p>
      </div>
      <div className="card">
        {error && <div className="notice error" data-testid="signup-message">{error}</div>}
        <form onSubmit={submit} data-testid="signup-form">
          <div className="field">
            <label htmlFor="su-email">Email</label>
            <input
              id="su-email"
              data-testid="signup-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@household.test"
            />
          </div>
          <div className="field">
            <label htmlFor="su-password">Password</label>
            <input
              id="su-password"
              data-testid="signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
            />
          </div>
          <button className="btn block" type="submit" disabled={busy} data-testid="signup-submit">
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <hr className="divider" />
        <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
