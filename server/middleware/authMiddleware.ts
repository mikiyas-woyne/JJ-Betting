import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.ts';
import { User } from '../../src/types.ts';

// Extend Express Request interface to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Middleware that validates JWT token in Authorization header
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : (req.query.token as string | undefined);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }

  let user = authService.getUserById(decoded.id);
  if (!user && decoded.email) {
    user = authService.getUserByEmail(decoded.email);
  }
  if (!user) {
    return res.status(401).json({ error: 'Authenticated user account no longer exists.' });
  }

  req.user = user;
  next();
};

/**
 * Middleware that checks if authenticated user has admin privileges
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Admin role check: only users with role === 'admin' can access admin endpoints
  const isAdminUser = req.user.role === 'admin';
  
  if (!isAdminUser) {
    return res.status(403).json({ error: 'Access denied: Administrative privileges required.' });
  }

  next();
};
