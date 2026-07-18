import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';

const SECRET = process.env.JWT_SECRET || 'dev-secret';
const SALT_ROUNDS = 10;

export type Role = 'ADMIN' | 'USER';

export interface AuthUser {
  id: string;
  role: Role;
}

// Augment Express' Request so req.user is typed everywhere downstream of authMiddleware.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(payload: object): string {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): unknown {
  return jwt.verify(token, SECRET);
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

interface TokenPayload {
  sub?: string;
  role?: string;
}

// Parses a Bearer token and attaches { id, role } to req.user. 401s on any failure.
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const decoded = verifyToken(token) as TokenPayload;
    if (!decoded || !decoded.sub) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    req.user = { id: decoded.sub, role: decoded.role === 'ADMIN' ? 'ADMIN' : 'USER' };
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}

// Gate a route to a single role (e.g. ADMIN). Must be mounted after authMiddleware.
export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    next();
  };
}
