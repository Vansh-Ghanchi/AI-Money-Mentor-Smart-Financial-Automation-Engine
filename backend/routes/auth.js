const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Business = require('../models/Business');
const fs = require('fs');
const path = require('path');


// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', async (req, res) => {
    try {
        let { name, email, password } = req.body;
        email = email?.toLowerCase().trim();

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = new User({
            name,
            email,
            password, // Will be hashed by model pre-save hook
            lastActive: new Date()
        });

        await user.save();

        // Create default wallets for new user
        const defaultWallets = [
            { userId: user._id, id: 'cash', name: 'Cash', balance: 0, type: 'cash' },
            { userId: user._id, id: 'online', name: 'Online', balance: 0, type: 'online' }
        ];

        await Wallet.insertMany(defaultWallets);

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'dev_secret_key_123',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email?.toLowerCase().trim();

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }

        // Find user by email
        const user = await User.findOne({ email }).populate('businessId', 'name logo');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare password with hashed password in database
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const secret = process.env.JWT_SECRET || 'dev_secret_key_123';
        const token = jwt.sign(
            { userId: user._id },
            secret,
            { expiresIn: '30d' }
        );

        // Ensure default wallets exist for this user
        const defaultWalletsConfig = [
            { id: 'cash', name: 'Cash', type: 'cash' },
            { id: 'online', name: 'Online', type: 'online' }
        ];

        for (const config of defaultWalletsConfig) {
            const walletExists = await Wallet.findOne({ userId: user._id, name: config.name });
            if (!walletExists) {
                await new Wallet({
                    userId: user._id,
                    ...config,
                    balance: 0
                }).save();
            }
        }

        // Update last active time
        user.lastActive = new Date();
        await user.save();

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                businessId: user.businessId
            }
        });
    } catch (error) {
        console.error('Login error:', error);

        try {
            const logPath = path.join(__dirname, '../login_error.log');
            const timestamp = new Date().toISOString();
            const logMessage = `\n${timestamp} - Login Error:\nMessage: ${error.message}\nStack: ${error.stack}\n`;
            fs.appendFileSync(logPath, logMessage);
        } catch (fileErr) {
            console.error('Failed to write error log:', fileErr);
        }

        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/auth/verify
// @desc    Verify token and get user data
// @access  Private
router.get('/verify', require('../middleware/auth'), async (req, res) => {
    try {
        // Update lastActive when user verifies token (reloads page or opens app)
        const user = await User.findByIdAndUpdate(
            req.userId,
            { lastActive: new Date() },
            { new: true }
        ).select('-password').populate('businessId', 'name logo'); // Include logo

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user and update lastActive
// @access  Private
router.post('/logout', require('../middleware/auth'), async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.userId, { lastActive: new Date() });
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/register-business
// @desc    Register new business with partners
// @access  Public
router.post('/register-business', async (req, res) => {
    try {
        const { businessName, partners, logo } = req.body;

        if (!businessName || !partners || partners.length < 2) {
            return res.status(400).json({ message: 'Please provide business name and at least 2 partners' });
        }

        // Validate all partners have required fields
        for (const partner of partners) {
            if (!partner.name || !partner.email || !partner.password) {
                return res.status(400).json({ message: 'All partners must have name, email and password' });
            }
            if (partner.password.length < 6) {
                return res.status(400).json({ message: 'All passwords must be at least 6 characters' });
            }
            // Check existing user
            const normalizedEmail = partner.email.toLowerCase().trim();
            const existing = await User.findOne({ email: normalizedEmail });
            if (existing) {
                return res.status(400).json({ message: `User with email ${partner.email} already exists` });
            }
        }

        // Create Business
        const business = new Business({
            name: businessName,
            logo: logo || undefined // Save logo if provided
        });
        await business.save();

        const createdPartners = [];

        // Create Users (Partners)
        for (const partnerData of partners) {
            const user = new User({
                name: partnerData.name,
                email: partnerData.email,
                password: partnerData.password, // Will be hashed by model pre-save hook
                businessId: business._id,
                lastActive: new Date()
            });
            await user.save();
            createdPartners.push(user);
        }

        // Update Business with partner IDs
        business.partners = createdPartners.map(u => u._id);
        await business.save();

        // Create Shared Default Wallets (Linked to Business and the first partner as 'owner' for fallback)
        // Note: For business logic, we'll primarily query by businessId
        const defaultWallets = [
            { userId: createdPartners[0]._id, businessId: business._id, id: 'cash', name: 'Cash', balance: 0, type: 'cash' },
            { userId: createdPartners[0]._id, businessId: business._id, id: 'online', name: 'Online', balance: 0, type: 'online' }
        ];

        await Wallet.insertMany(defaultWallets);

        // Return token for the first partner to auto-login
        const token = jwt.sign(
            { userId: createdPartners[0]._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            token,
            user: {
                _id: createdPartners[0]._id,
                name: createdPartners[0].name,
                email: createdPartners[0].email,
                role: 'user',
                businessId: {
                    _id: business._id,
                    name: business.name
                }
            }
        });

    } catch (error) {
        console.error('Business register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/toggle-upi
// @desc    Toggle UPI tracking and generate UPI if needed
// @access  Private
router.post('/toggle-upi', require('../middleware/auth'), async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.upiEnabled = !user.upiEnabled;

        // Generate UPI if not exists and being enabled
        if (user.upiEnabled && !user.generatedUPI) {
            // Generate a simple unique UPI: name + random 4 digits + @expenseai
            const cleanName = user.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const random = Math.floor(1000 + Math.random() * 9000);
            user.generatedUPI = `${cleanName}${random}@expenseai`;
        }

        await user.save();
        res.json({
            upiEnabled: user.upiEnabled,
            generatedUPI: user.generatedUPI
        });
    } catch (error) {
        console.error('Toggle UPI error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Public
router.post('/logout', (req, res) => {
    // Since we use JWT, we don't need to do much on the server
    // but the endpoint should exist to avoid 404s
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
