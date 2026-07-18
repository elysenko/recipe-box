import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, signToken, verifyPassword } from '../lib/auth';

export const authRouter = Router();

// POST /api/auth/login -> { token, user: { id, email, role } }
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }
  const user = await prisma.user.findUnique({ where: { email: String(email) } });
  if (!user || !verifyPassword(String(password), user.password)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  const token = signToken({ sub: user.id, role: user.role });
  return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// GET /api/auth/me -> { id, email, role } for the current bearer token.
authRouter.get('/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  return res.json({ id: user.id, email: user.email, role: user.role });
});
