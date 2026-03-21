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

        // Ensure default wallets exist
        const defaultConfigs = [
            { id: 'cash', name: 'Cash', type: 'cash' },
            { id: 'online', name: 'Online', type: 'online' }
        ];

        for (const config of defaultConfigs) {
            const exists = await Wallet.findOne({
                ...query,
                name: { $regex: new RegExp(`^${config.name}$`, 'i') }
            });
            if (!exists) {
                await new Wallet({
                    ...query,
                    ...config,
                    userId: req.userId,
                    balance: 0
                }).save();
            }
        }

        const wallets = await Wallet.find(query);
        console.log(`📡 Returning ${wallets.length} wallets for user ${req.userId}`);
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

        // Check if wallet with same id exists for user/business
        const User = require('../models/User');
        const user = await User.findById(req.userId);

        let existingWalletQuery = { id };
        if (user.businessId) {
            existingWalletQuery.businessId = user.businessId;
        } else {
            existingWalletQuery.userId = req.userId;
        }

        const existingWallet = await Wallet.findOne(existingWalletQuery);
        if (existingWallet) {
            return res.status(400).json({ message: 'Wallet with this ID already exists' });
        }

        // Create wallet
        const wallet = new Wallet({
            userId: req.userId,
            businessId: user.businessId || undefined,
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
        const User = require('../models/User');
        const user = await User.findById(req.userId);

        let query = { id: req.params.id };
        if (user.businessId) {
            query.businessId = user.businessId;
        } else {
            query.userId = req.userId;
        }

        const wallet = await Wallet.findOne(query);

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
        const User = require('../models/User');
        const user = await User.findById(req.userId);

        let query = { id: req.params.id };
        if (user.businessId) {
            query.businessId = user.businessId;
        } else {
            query.userId = req.userId;
        }

        const wallet = await Wallet.findOne(query);

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        // Check if wallet has transactions
        const Transaction = require('../models/Transaction');
        const transactionCount = await Transaction.countDocuments({ walletId: wallet.id });
        if (transactionCount > 0) {
            return res.status(400).json({
                message: `Cannot delete wallet. It has ${transactionCount} existing transactions. Please delete or move them first.`
            });
        }

        await wallet.deleteOne();
        res.json({ message: 'Wallet deleted' });
    } catch (error) {
        console.error('Delete wallet error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
