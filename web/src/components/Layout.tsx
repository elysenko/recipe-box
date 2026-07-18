import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface NavItem {
  to: string;
  label: string;
  ico: string;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: '/recipes', label: 'Recipes', ico: '📖' },
  { to: '/planner', label: 'Planner', ico: '🗓️' },
  { to: '/admin', label: 'All Recipes', ico: '👥', adminOnly: true },
  { to: '/admin/settings', label: 'Settings', ico: '⚙️', adminOnly: true },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, demoMode } = useAuth();
  const items = NAV.filter((n) => !n.adminOnly || user?.role === 'ADMIN');
  const initial = (user?.email?.[0] ?? '?').toUpperCase();

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/recipes" className="brand">
          <span className="logo" aria-hidden>🍲</span>
          <span>Recipe Box</span>
        </NavLink>
        <nav className="topnav" aria-label="Primary">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span aria-hidden>{n.ico}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <span className="spacer" />
        {user && (
          <div className="userchip" data-testid="user-chip">
            <span className="who">
              <b>{user.email}</b>
              <span>{user.role}</span>
            </span>
            <span className={`badge role-${user.role.toLowerCase()}`}>{initial}</span>
            <button className="btn secondary sm" onClick={logout} data-testid="logout-btn">
              Sign out
            </button>
          </div>
        )}
      </header>

      {demoMode && (
        <div className="content" style={{ paddingBottom: 0 }}>
          <div className="notice demo" data-testid="demo-banner">
            Demo preview — signed in with seeded data. Connect the backend for live persistence.
          </div>
        </div>
      )}

      <main className="content">{children}</main>

      <nav className="tabbar" aria-label="Primary mobile">
        {items.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="ico" aria-hidden>{n.ico}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
