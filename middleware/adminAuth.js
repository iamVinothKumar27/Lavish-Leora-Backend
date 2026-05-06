const auth = require('./auth');

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    console.log(`[AdminAuth] user: ${req.user.email} | role: ${req.user.role}`);
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  });
};

module.exports = adminAuth;
