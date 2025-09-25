module.exports = function adminMiddleware(req, res, next) {
  try {
    const provided = req.header('X-Admin-Key') || req.header('x-admin-key') || '';
    const envKey = process.env.ADMIN_API_KEY || process.env.AIVERSE_ADMIN_KEY || '';
    // Also allow query for quick local ops, but prefer header
    const key = provided || req.query.admin_key || '';
    if (!envKey && !key) {
      return res.status(401).json({ error: 'admin_key_required' });
    }
    const valid = envKey ? key === envKey : Boolean(key);
    if (!valid) {
      return res.status(403).json({ error: 'forbidden' });
    }
    req.isAdmin = true;
    next();
  } catch (e) {
    return res.status(500).json({ error: 'admin_check_failed' });
  }
};


