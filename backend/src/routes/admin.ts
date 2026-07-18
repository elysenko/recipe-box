import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, requireRole } from '../lib/auth';
import { toRecipeDto } from '../lib/recipe';

export const adminRouter = Router();

// Every admin route requires an authenticated ADMIN.
adminRouter.use(authMiddleware, requireRole('ADMIN'));

// GET /api/admin/recipes -> all recipes grouped by owner.
adminRouter.get('/recipes', async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { email: 'asc' },
    include: { recipes: { orderBy: { createdAt: 'desc' } } },
  });
  const groups = users
    .filter((u) => u.recipes.length > 0)
    .map((u) => ({
      ownerId: u.id,
      email: u.email,
      role: u.role,
      recipes: u.recipes.map(toRecipeDto),
    }));
  return res.json(groups);
});

// GET /api/admin/settings -> configurable integration settings.
// This app has no third-party integrations, so the list is empty.
adminRouter.get('/settings', async (_req, res) => {
  return res.json([]);
});

// PATCH /api/admin/settings { key, values } -> accepted no-op (no integrations to store).
adminRouter.patch('/settings', async (_req, res) => {
  return res.json({ ok: true });
});
