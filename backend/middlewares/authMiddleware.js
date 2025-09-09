const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const authMiddleware = (req, res, next) => {
    try {
        // Extract token from Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET);

        if (!decoded || !decoded.userId) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = decoded;  // Attach user payload to request

        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
