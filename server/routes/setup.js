const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @route   POST /api/setup/make-admin
// @desc    Make a user admin by email
// @access  Public (should be removed after setup)
router.post('/make-admin', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.json({
                message: 'User is already an admin',
                email: user.email,
                name: user.name
            });
        }

        user.role = 'admin';
        await user.save();

        res.json({
            message: 'User updated to admin successfully!',
            email: user.email,
            name: user.name,
            note: 'Please logout and login again to see admin features'
        });
    } catch (error) {
        console.error('Error making user admin:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/setup/create-admin-custom
// @desc    Create admin user with custom credentials
// @access  Public (should be removed after first use)
router.post('/create-admin-custom', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(400).json({
                message: 'User with this email already exists',
                note: 'Please use a different email or login with existing credentials'
            });
        }

        // Create new admin user with custom credentials
        const hashedPassword = await bcrypt.hash(password, 10);

        const adminUser = new User({
            name: name || 'Admin User',
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'admin'
        });

        await adminUser.save();

        res.json({
            message: 'Admin user created successfully!',
            email: email.toLowerCase(),
            name: adminUser.name,
            note: 'Please login at http://localhost:5173/login with your credentials'
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
