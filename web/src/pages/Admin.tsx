import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { demoOwnerGroups } from '../lib/mock';
import type { OwnerGroup } from '../lib/types';

export default function Admin() {
  const [groups, setGroups] = useState<OwnerGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api<OwnerGroup[]>('/api/admin/recipes')
      .then((g) => alive && setGroups(g))
      .catch(() => alive && setGroups(demoOwnerGroups))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const total = groups.reduce((n, g) => n + g.recipes.length, 0);

  return (
    <div data-testid="admin-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 data-testid="admin-title">All Recipes</h1>
          <p>{groups.length} members · {total} recipes across the household.</p>
        </div>
        <Link className="btn secondary" to="/admin/settings">⚙️ Settings</Link>
      </div>

      {loading ? (
        <div className="spinner" data-testid="admin-loading" />
      ) : groups.length === 0 ? (
        <div className="empty" data-testid="admin-empty">
          <div className="emoji">📭</div>
          <h2>No recipes yet</h2>
        </div>
      ) : (
        <div data-testid="admin-groups">
          {groups.map((g) => (
            <section key={g.ownerId} className="owner-group" data-testid="owner-group">
              <div className="owner-head">
                <span className="avatar" aria-hidden>{g.email[0].toUpperCase()}</span>
                <div>
                  <b>{g.email}</b>{' '}
                  <span className={`badge role-${g.role.toLowerCase()}`}>{g.role}</span>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>{g.recipes.length} recipes</div>
                </div>
              </div>
              {g.recipes.length === 0 ? (
                <p className="muted">No recipes.</p>
              ) : (
                <div className="grid">
                  {g.recipes.map((r) => (
                    <Link key={r.id} to={`/recipes/${r.id}`} className="card recipe-card" data-testid="admin-recipe-card">
                      <div className="thumb" aria-hidden>🍳</div>
                      <h3>{r.title}</h3>
                      <div className="meta">Serves {r.servings} · {r.ingredients.length} ingredients</div>
                      <div>{r.tags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}</div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
