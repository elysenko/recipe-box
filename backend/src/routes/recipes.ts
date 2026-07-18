import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { serializeArray, toRecipeDto } from '../lib/recipe';

export const recipesRouter = Router();

// Every recipe route requires authentication.
recipesRouter.use(authMiddleware);

// GET /api/recipes -> the caller's own recipes (newest first).
recipesRouter.get('/', async (req, res) => {
  const recipes = await prisma.recipe.findMany({
    where: { ownerId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(recipes.map(toRecipeDto));
});

// POST /api/recipes -> create a recipe owned by the caller.
recipesRouter.post('/', async (req, res) => {
  const { title, ingredients, steps, tags, servings } = req.body ?? {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const recipe = await prisma.recipe.create({
    data: {
      title: title.trim(),
      ingredients: serializeArray(ingredients),
      steps: serializeArray(steps),
      tags: serializeArray(tags),
      servings: Number.isFinite(Number(servings)) ? Math.max(1, Math.trunc(Number(servings))) : 1,
      ownerId: req.user!.id,
    },
  });
  return res.status(201).json(toRecipeDto(recipe));
});

// GET /api/recipes/:id -> full recipe. USER may read only its own; ADMIN any.
recipesRouter.get('/:id', async (req, res) => {
  const recipe = await prisma.recipe.findUnique({ where: { id: req.params.id } });
  if (!recipe) return res.status(404).json({ error: 'not found' });
  if (req.user!.role !== 'ADMIN' && recipe.ownerId !== req.user!.id) {
    return res.status(404).json({ error: 'not found' });
  }
  return res.json(toRecipeDto(recipe));
});

// PUT /api/recipes/:id -> update. USER may edit only its own; ADMIN any.
recipesRouter.put('/:id', async (req, res) => {
  const existing = await prisma.recipe.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'not found' });
  if (req.user!.role !== 'ADMIN' && existing.ownerId !== req.user!.id) {
    return res.status(404).json({ error: 'not found' });
  }
  const { title, ingredients, steps, tags, servings } = req.body ?? {};
  const updated = await prisma.recipe.update({
    where: { id: existing.id },
    data: {
      title: typeof title === 'string' && title.trim() ? title.trim() : existing.title,
      ingredients: ingredients !== undefined ? serializeArray(ingredients) : existing.ingredients,
      steps: steps !== undefined ? serializeArray(steps) : existing.steps,
      tags: tags !== undefined ? serializeArray(tags) : existing.tags,
      servings:
        servings !== undefined && Number.isFinite(Number(servings))
          ? Math.max(1, Math.trunc(Number(servings)))
          : existing.servings,
    },
  });
  return res.json(toRecipeDto(updated));
});

// DELETE /api/recipes/:id -> remove. USER may delete only its own; ADMIN any.
recipesRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.recipe.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'not found' });
  if (req.user!.role !== 'ADMIN' && existing.ownerId !== req.user!.id) {
    return res.status(404).json({ error: 'not found' });
  }
  await prisma.recipe.delete({ where: { id: existing.id } });
  return res.status(204).end();
});
