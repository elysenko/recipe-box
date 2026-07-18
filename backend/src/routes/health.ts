import { Router } from 'express';

export const healthRouter = Router();

// Platform backend reachability probe (descriptor backend_probe_path). No auth.
healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
