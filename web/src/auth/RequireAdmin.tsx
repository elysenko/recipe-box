import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return <div className="spinner" data-testid="auth-loading" />;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  if (user.role !== 'ADMIN') {
    return (
      <main className="content" data-testid="admin-forbidden">
        <div className="empty">
          <div className="emoji">🔒</div>
          <h2>Admins only</h2>
          <p>You don’t have permission to view this page.</p>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
