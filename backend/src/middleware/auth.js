export function requireAuth(req,res,next) {
  if (!req.session?.user) return res.status(401).json({ error: 'Authentication required.' });
  req.user = req.session.user;
  next();
}
export function requireRole(...roles) {
  return (req,res,next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    next();
  };
}
