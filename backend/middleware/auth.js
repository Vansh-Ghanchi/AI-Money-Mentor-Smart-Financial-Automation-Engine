const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Try Verify JWT first
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.userId;

            // Proactively update lastActive
            User.findByIdAndUpdate(decoded.userId, { lastActive: new Date() }).catch(err => console.error('LastActive update error:', err));

            return next();
        } catch (jwtErr) {
            // Check if it's a UPI (even if disabled) to provide better error message
            const userWithUPI = await User.findOne({ generatedUPI: token });

            if (userWithUPI) {
                if (!userWithUPI.upiEnabled) {
                    throw new Error('UPI Payment Tracking is turned OFF in your App Settings. Please turn it ON to use this feature.');
                }

                req.userId = userWithUPI._id;
                req.isUPI = true; // Flag for downstream routes
                userWithUPI.lastActive = new Date();
                await userWithUPI.save();
                return next();
            }
            throw new Error('Invalid Tracking UPI or Token');
        }
    } catch (error) {
        res.status(401).json({ message: error.message || 'Token is not valid' });
    }
};
