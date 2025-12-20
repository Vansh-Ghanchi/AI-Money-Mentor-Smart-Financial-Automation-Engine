const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

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

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            lastActive: new Date()
        });

        await user.save();

        // Create default wallets for new user
        const defaultWallets = [
            { userId: user._id, id: 'cash', name: 'Cash', balance: 0, type: 'cash' },
            { userId: user._id, id: 'bank', name: 'Bank Account', balance: 0, type: 'bank' },
            { userId: user._id, id: 'card', name: 'Credit Card', balance: 0, type: 'card' },
            { userId: user._id, id: 'upi', name: 'UPI', balance: 0, type: 'upi' }
        ];

        await Wallet.insertMany(defaultWallets);

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
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
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }

        // Check if user exists
        const user = await User.findOne({ email }).populate('businessId', 'name logo');
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

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
        console.error('Error details:', error.message);
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
            const existing = await User.findOne({ email: partner.email });
            if (existing) {
                return res.status(400).json({ message: `User with email ${partner.email} already exists` });
            }
        }

        const Business = require('../models/Business');

        // Create Business
        const business = new Business({
            name: businessName,
            logo: logo || undefined // Save logo if provided
        });
        await business.save();

        const createdPartners = [];

        // Create Users (Partners)
        for (const partnerData of partners) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(partnerData.password, salt);

            const user = new User({
                name: partnerData.name,
                email: partnerData.email,
                password: hashedPassword,
                businessId: business._id,
                // Only set lastActive for the one who will be logged in (first partner)
                lastActive: createdPartners.length === 0 ? new Date() : undefined
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
            { userId: createdPartners[0]._id, businessId: business._id, id: 'bank', name: 'Bank Account', balance: 0, type: 'bank' },
            { userId: createdPartners[0]._id, businessId: business._id, id: 'card', name: 'Credit Card', balance: 0, type: 'card' },
            { userId: createdPartners[0]._id, businessId: business._id, id: 'upi', name: 'UPI', balance: 0, type: 'upi' }
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

module.exports = router;
