const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;

        // Proactively update lastActive without blocking the request
        User.findByIdAndUpdate(decoded.userId, { lastActive: new Date() }).catch(err => console.error('LastActive update error:', err));

        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
