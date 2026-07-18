import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { currentWeek, isValidWeek } from '../lib/week';

export const plannerRouter = Router();

plannerRouter.use(authMiddleware);

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

interface PlanEntryRow {
  id: string;
  week: string;
  day: string;
  recipeId: string;
  recipe: { title: string } | null;
}

function toPlanDto(row: PlanEntryRow) {
  return {
    id: row.id,
    week: row.week,
    day: row.day,
    recipeId: row.recipeId,
    recipeTitle: row.recipe?.title,
  };
}

// GET /api/planner?week=<ISO> -> caller's entries for that week (defaults to current).
plannerRouter.get('/', async (req, res) => {
  const weekParam = typeof req.query.week === 'string' ? req.query.week : '';
  const week = isValidWeek(weekParam) ? weekParam : currentWeek();
  const entries = await prisma.planEntry.findMany({
    where: { userId: req.user!.id, week },
    include: { recipe: { select: { title: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return res.json(entries.map(toPlanDto));
});

// POST /api/planner { week, day, recipeId } -> assign a recipe to a day (idempotent).
plannerRouter.post('/', async (req, res) => {
  const { week, day, recipeId } = req.body ?? {};
  if (!isValidWeek(String(week))) return res.status(400).json({ error: 'invalid week' });
  if (!DAYS.includes(String(day))) return res.status(400).json({ error: 'invalid day' });
  if (!recipeId || typeof recipeId !== 'string') {
    return res.status(400).json({ error: 'recipeId is required' });
  }

  // The recipe must be visible to the caller (own recipe, or any recipe for ADMIN).
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) return res.status(404).json({ error: 'recipe not found' });
  if (req.user!.role !== 'ADMIN' && recipe.ownerId !== req.user!.id) {
    return res.status(404).json({ error: 'recipe not found' });
  }

  const entry = await prisma.planEntry.upsert({
    where: {
      userId_week_day_recipeId: {
        userId: req.user!.id,
        week: String(week),
        day: String(day),
        recipeId,
      },
    },
    update: {},
    create: { userId: req.user!.id, week: String(week), day: String(day), recipeId },
    include: { recipe: { select: { title: true } } },
  });
  return res.status(201).json(toPlanDto(entry));
});

// DELETE /api/planner/:id -> remove one of the caller's assignments.
plannerRouter.delete('/:id', async (req, res) => {
  const entry = await prisma.planEntry.findUnique({ where: { id: req.params.id } });
  if (!entry) return res.status(404).json({ error: 'not found' });
  if (entry.userId !== req.user!.id) return res.status(404).json({ error: 'not found' });
  await prisma.planEntry.delete({ where: { id: entry.id } });
  return res.status(204).end();
});
