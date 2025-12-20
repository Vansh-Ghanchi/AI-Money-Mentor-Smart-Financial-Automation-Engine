const router = require('express').Router();
const Wallet = require('../models/Wallet');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/wallets
// @desc    Get all wallets for logged-in user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.userId);

        let query = { userId: req.userId };
        if (user.businessId) {
            query = { businessId: user.businessId };
        }

        const wallets = await Wallet.find(query);
        res.json(wallets);
    } catch (error) {
        console.error('Get wallets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/wallets
// @desc    Create new wallet
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { id, name, balance, type } = req.body;

        // Validation
        if (!id || !name || !type) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if wallet with same id exists for user
        const existingWallet = await Wallet.findOne({ userId: req.userId, id });
        if (existingWallet) {
            return res.status(400).json({ message: 'Wallet with this ID already exists' });
        }

        // Create wallet
        const wallet = new Wallet({
            userId: req.userId,
            id,
            name,
            balance: balance || 0,
            type
        });

        await wallet.save();
        res.status(201).json(wallet);
    } catch (error) {
        console.error('Create wallet error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/wallets/:id
// @desc    Update wallet
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ userId: req.userId, id: req.params.id });

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        // Update wallet
        Object.assign(wallet, req.body);
        await wallet.save();

        res.json(wallet);
    } catch (error) {
        console.error('Update wallet error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/wallets/:id
// @desc    Delete wallet
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ userId: req.userId, id: req.params.id });

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        await wallet.deleteOne();
        res.json({ message: 'Wallet deleted' });
    } catch (error) {
        console.error('Delete wallet error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
