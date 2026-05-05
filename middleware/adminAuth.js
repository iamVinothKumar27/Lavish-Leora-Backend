const auth = require('./auth');

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  });
};

module.exports = adminAuth;
