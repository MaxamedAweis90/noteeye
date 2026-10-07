import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware
 * Extracts and verifies Bearer token from Authorization header.
 * Attaches req.user = { id: decoded.id } to valid requests.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[Auth Middleware] JWT_SECRET is not configured');
      return res.status(500).json({ message: 'Server authentication configuration error' });
    }

    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
