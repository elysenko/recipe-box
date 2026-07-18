import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { demoRecipes } from '../lib/mock';
import type { Recipe } from '../lib/types';

function toLines(v: string): string[] {
  return v.split('\n').map((s) => s.trim()).filter(Boolean);
}
function toTags(v: string): string[] {
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

export default function Recipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);

  // create form
  const [title, setTitle] = useState('');
  const [servings, setServings] = useState('2');
  const [tags, setTags] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    api<Recipe[]>('/api/recipes')
      .then((data) => alive && setRecipes(data))
      .catch(() => alive && setRecipes(demoRecipes))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [recipes, query]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    const payload = {
      title: title.trim(),
      servings: parseInt(servings, 10) || 1,
      tags: toTags(tags),
      ingredients: toLines(ingredients),
      steps: toLines(steps),
    };
    try {
      const created = await api<Recipe>('/api/recipes', {
        method: 'POST',
        body: JSON.stringify(payload),
      }).catch(() => ({ id: `local-${Date.now()}`, ...payload } as Recipe));
      setRecipes((prev) => [created, ...prev]);
      setTitle('');
      setServings('2');
      setTags('');
      setIngredients('');
      setSteps('');
      setShowForm(false);
    } catch {
      setError('Could not save the recipe.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="recipes-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Your collection</div>
          <h1 data-testid="recipes-title">Recipes</h1>
          <p>Browse, search and add recipes for your household.</p>
        </div>
        <button className="btn" onClick={() => setShowForm((v) => !v)} data-testid="new-recipe-btn">
          {showForm ? 'Close' : '➕ New recipe'}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={create} data-testid="recipe-form" style={{ marginBottom: 18 }}>
          <h2>Add a recipe</h2>
          {error && <div className="notice error">{error}</div>}
          <div className="row" style={{ gap: 14 }}>
            <div className="field" style={{ flex: '2 1 220px' }}>
              <label htmlFor="r-title">Title</label>
              <input id="r-title" data-testid="recipe-title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lemon Pasta" />
            </div>
            <div className="field" style={{ flex: '1 1 100px' }}>
              <label htmlFor="r-serv">Servings</label>
              <input id="r-serv" type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="r-tags">Tags <span className="muted">(comma separated)</span></label>
            <input id="r-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="dinner, vegetarian, quick" />
          </div>
          <div className="field">
            <label htmlFor="r-ing">Ingredients <span className="muted">(one per line)</span></label>
            <textarea id="r-ing" value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder={'200g spaghetti\n2 lemons'} />
          </div>
          <div className="field">
            <label htmlFor="r-steps">Steps <span className="muted">(one per line)</span></label>
            <textarea id="r-steps" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={'Boil pasta\nToss with lemon'} />
          </div>
          <button className="btn" type="submit" disabled={saving} data-testid="recipe-save-btn">
            {saving ? 'Saving…' : 'Save recipe'}
          </button>
        </form>
      )}

      <div className="field" style={{ maxWidth: 360 }}>
        <input
          data-testid="recipe-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Search recipes or tags"
          aria-label="Search recipes"
        />
      </div>

      {loading ? (
        <div className="spinner" data-testid="recipes-loading" />
      ) : filtered.length === 0 ? (
        <div className="empty" data-testid="recipes-empty">
          <div className="emoji">🍽️</div>
          <h2>{recipes.length === 0 ? 'No recipes yet' : 'No matches'}</h2>
          <p>{recipes.length === 0 ? 'Add your first recipe to get started.' : 'Try a different search.'}</p>
        </div>
      ) : (
        <div className="grid" data-testid="recipes-list">
          {filtered.map((r) => (
            <article
              key={r.id}
              className="card recipe-card"
              data-testid="recipe-card"
              onClick={() => navigate(`/recipes/${r.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/recipes/${r.id}`)}
            >
              <div className="thumb" aria-hidden>🍳</div>
              <h3>{r.title}</h3>
              <div className="meta">Serves {r.servings} · {r.ingredients.length} ingredients</div>
              <div>{r.tags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
