import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { demoAdminOwnedRecipes, demoRecipes } from '../lib/mock';
import type { Recipe } from '../lib/types';

function findDemo(id: string): Recipe | undefined {
  return [...demoRecipes, ...demoAdminOwnedRecipes].find((r) => r.id === id);
}

export default function RecipeDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);

  // edit buffers
  const [title, setTitle] = useState('');
  const [servings, setServings] = useState('1');
  const [tags, setTags] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    api<Recipe>(`/api/recipes/${id}`)
      .then((r) => alive && setRecipe(r))
      .catch(() => {
        const demo = findDemo(id);
        if (!alive) return;
        if (demo) setRecipe(demo);
        else setNotFound(true);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  function startEdit() {
    if (!recipe) return;
    setTitle(recipe.title);
    setServings(String(recipe.servings));
    setTags(recipe.tags.join(', '));
    setIngredients(recipe.ingredients.join('\n'));
    setSteps(recipe.steps.join('\n'));
    setEditing(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!recipe) return;
    const updated: Recipe = {
      ...recipe,
      title: title.trim(),
      servings: parseInt(servings, 10) || 1,
      tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
      ingredients: ingredients.split('\n').map((s) => s.trim()).filter(Boolean),
      steps: steps.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    const saved = await api<Recipe>(`/api/recipes/${recipe.id}`, {
      method: 'PUT',
      body: JSON.stringify(updated),
    }).catch(() => updated);
    setRecipe(saved);
    setEditing(false);
  }

  async function remove() {
    if (!recipe) return;
    if (!confirm(`Delete “${recipe.title}”? This cannot be undone.`)) return;
    await api(`/api/recipes/${recipe.id}`, { method: 'DELETE' }).catch(() => null);
    navigate('/recipes');
  }

  if (loading) return <div className="spinner" data-testid="recipe-loading" />;

  if (notFound || !recipe) {
    return (
      <div className="empty" data-testid="recipe-notfound">
        <div className="emoji">🔍</div>
        <h2>Recipe not found</h2>
        <p>It may have been deleted.</p>
        <Link className="btn secondary" to="/recipes">Back to recipes</Link>
      </div>
    );
  }

  return (
    <div data-testid="recipe-detail">
      <Link to="/recipes" className="btn ghost sm" style={{ paddingLeft: 0 }}>← All recipes</Link>

      {editing ? (
        <form className="card" onSubmit={save} data-testid="recipe-edit-form" style={{ marginTop: 12 }}>
          <h2>Edit recipe</h2>
          <div className="row" style={{ gap: 14 }}>
            <div className="field" style={{ flex: '2 1 220px' }}>
              <label htmlFor="e-title">Title</label>
              <input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="field" style={{ flex: '1 1 100px' }}>
              <label htmlFor="e-serv">Servings</label>
              <input id="e-serv" type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="e-tags">Tags</label>
            <input id="e-tags" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="e-ing">Ingredients (one per line)</label>
            <textarea id="e-ing" value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="e-steps">Steps (one per line)</label>
            <textarea id="e-steps" value={steps} onChange={(e) => setSteps(e.target.value)} />
          </div>
          <div className="row">
            <button className="btn" type="submit" data-testid="recipe-update-btn">Save changes</button>
            <button className="btn secondary" type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <div className="page-head" style={{ marginTop: 12 }}>
            <div>
              <h1 data-testid="recipe-title">{recipe.title}</h1>
              <p className="muted">Serves {recipe.servings}</p>
              <div>{recipe.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
            </div>
            <div className="row">
              <button className="btn secondary" onClick={startEdit} data-testid="recipe-edit-btn">✏️ Edit</button>
              <button className="btn danger" onClick={remove} data-testid="recipe-delete-btn">🗑 Delete</button>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            <section className="card" data-testid="recipe-ingredients">
              <h2>Ingredients</h2>
              <ul className="stack" style={{ paddingLeft: 18, margin: 0 }}>
                {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
              </ul>
            </section>
            <section className="card" data-testid="recipe-steps">
              <h2>Steps</h2>
              <ol className="stack" style={{ paddingLeft: 18, margin: 0 }}>
                {recipe.steps.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
              </ol>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
