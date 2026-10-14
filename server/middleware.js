import jwt from 'jsonwebtoken';
export function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return required ? res.status(401).json({ error: 'Please sign in first.' }) : next();
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev_only_change_me');
      next();
    } catch {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
  };
}
export function roles(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) return res.status(403).json({ error: 'You do not have permission for this action.' });
    next();
  };
}
