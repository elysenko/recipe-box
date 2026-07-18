import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { demoPlanEntries, demoRecipes } from '../lib/mock';
import type { PlanEntry, Recipe } from '../lib/types';
import {
  currentWeek,
  DAYS,
  DAY_LABELS,
  dateForDay,
  shiftWeek,
  shortDate,
  weekRangeLabel,
  type Day,
} from '../lib/week';

export default function Planner() {
  const [params, setParams] = useSearchParams();
  const week = params.get('week') || currentWeek();
  const thisWeek = currentWeek();

  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api<Recipe[]>('/api/recipes')
      .then((r) => alive && setRecipes(r))
      .catch(() => alive && setRecipes(demoRecipes));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api<PlanEntry[]>(`/api/planner?week=${encodeURIComponent(week)}`)
      .then((e) => alive && setEntries(e))
      .catch(() => alive && setEntries(demoPlanEntries(week)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [week]);

  const byDay = useMemo(() => {
    const map: Record<string, PlanEntry[]> = {};
    for (const d of DAYS) map[d] = [];
    for (const e of entries) (map[e.day] ??= []).push(e);
    return map;
  }, [entries]);

  function setWeek(next: string) {
    setParams(next === thisWeek ? {} : { week: next });
  }

  const recipeTitle = (id: string) => recipes.find((r) => r.id === id)?.title ?? 'Recipe';

  async function assign(day: Day, recipeId: string) {
    if (!recipeId) return;
    const optimistic: PlanEntry = {
      id: `local-${Date.now()}`,
      week,
      day,
      recipeId,
      recipeTitle: recipeTitle(recipeId),
    };
    const saved = await api<PlanEntry>('/api/planner', {
      method: 'POST',
      body: JSON.stringify({ week, day, recipeId }),
    }).catch(() => optimistic);
    setEntries((prev) => [...prev, { ...saved, recipeTitle: saved.recipeTitle ?? optimistic.recipeTitle }]);
  }

  async function unassign(entry: PlanEntry) {
    await api(`/api/planner/${entry.id}`, { method: 'DELETE' }).catch(() => null);
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div data-testid="planner-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Meal planner</div>
          <h1 data-testid="planner-title">Weekly Meal Plan</h1>
          <p>Assign recipes to each day. Your plan is saved per week.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="week-nav">
          <button className="btn secondary sm" onClick={() => setWeek(shiftWeek(week, -1))} data-testid="week-prev">← Prev</button>
          <div className="wk" data-testid="planner-week">
            {week}
            <div className="muted" style={{ fontSize: '0.78rem', fontWeight: 400 }}>{weekRangeLabel(week)}</div>
          </div>
          <button className="btn secondary sm" onClick={() => setWeek(shiftWeek(week, 1))} data-testid="week-next">Next →</button>
          {week !== thisWeek && (
            <button className="btn ghost sm" onClick={() => setWeek(thisWeek)} data-testid="week-today">This week</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="spinner" data-testid="planner-loading" />
      ) : (
        <div className="days" data-testid="planner-days">
          {DAYS.map((day) => {
            const date = dateForDay(week, day);
            const isToday = date.toISOString().slice(0, 10) === todayIso;
            const dayEntries = byDay[day] ?? [];
            return (
              <div key={day} className={`day${isToday ? ' today' : ''}`} data-testid={`day-${day}`}>
                <div className="day-head">
                  <span className="dow">{DAY_LABELS[day]}</span>
                  <span className="date">{shortDate(date)}{isToday ? ' · today' : ''}</span>
                </div>

                {dayEntries.length === 0 ? (
                  <p className="muted" style={{ fontSize: '0.85rem', margin: '4px 0 10px' }}>No meal planned</p>
                ) : (
                  dayEntries.map((e) => (
                    <div key={e.id} className="slot" data-testid="plan-entry">
                      <span className="name">🍽️ {e.recipeTitle ?? recipeTitle(e.recipeId)}</span>
                      <button className="x" onClick={() => unassign(e)} aria-label="Remove meal" data-testid="plan-remove">✕</button>
                    </div>
                  ))
                )}

                <select
                  value=""
                  onChange={(e) => assign(day, e.target.value)}
                  data-testid={`assign-${day}`}
                  aria-label={`Add a recipe to ${DAY_LABELS[day]}`}
                >
                  <option value="">＋ Add a recipe…</option>
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
