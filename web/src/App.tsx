// Route-verifiability contract (Colossus): every navigable UI state MUST be reachable
// from a URL alone (deep-linkable BrowserRouter routes; nginx serves try_files fallback).
// Keep data-testid="app-ready" on the shell root — the mockup gate waits for it.
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import RequireAdmin from './auth/RequireAdmin';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import Planner from './pages/Planner';
import Admin from './pages/Admin';
import AdminSettings from './pages/AdminSettings';
import NotFound from './pages/NotFound';
import './styles.css';

function Guarded({ children, admin }: { children: React.ReactNode; admin?: boolean }) {
  const inner = admin ? <RequireAdmin>{children}</RequireAdmin> : children;
  return (
    <RequireAuth>
      <Layout>{inner}</Layout>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div data-testid="app-ready">
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/recipes" element={<Guarded><Recipes /></Guarded>} />
          <Route path="/recipes/:id" element={<Guarded><RecipeDetail /></Guarded>} />
          <Route path="/planner" element={<Guarded><Planner /></Guarded>} />
          <Route path="/admin" element={<Guarded admin><Admin /></Guarded>} />
          <Route path="/admin/settings" element={<Guarded admin><AdminSettings /></Guarded>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
