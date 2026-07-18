import express from 'express';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { recipesRouter } from './routes/recipes';
import { plannerRouter } from './routes/planner';
import { adminRouter } from './routes/admin';

export const app = express();
app.use(express.json());

// Permissive CORS — in production nginx proxies the SPA to /api same-origin,
// but this keeps local dev (vite proxy / direct calls) working too.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// API routes. Mounted before any catch-all so /api/* is never shadowed.
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/planner', plannerRouter);
app.use('/api/admin', adminRouter);
