import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}
export const AuthenticatedRequest = {} as unknown as AuthenticatedRequest;

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-noteeye-2026';

/**
 * Production JWT Authentication Middleware
 * Enforces strict multi-tenant isolation by requiring a valid Bearer JWT.
 * Returns 401 Unauthorized immediately if missing, invalid, or expired.
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email?: string };
        if (!decoded || !decoded.id) {
          res.status(401).json({ message: 'Malformed authorization token.' });
          return;
        }
        req.user = { id: decoded.id, email: decoded.email };
        return next();
      } catch (err: any) {
        res.status(401).json({ message: 'Invalid or expired authorization token.' });
        return;
      }
    }
  }

  res.status(401).json({ message: 'Authentication required. Please sign in to continue.' });
};

export const authenticate = authMiddleware;
export default authMiddleware;
