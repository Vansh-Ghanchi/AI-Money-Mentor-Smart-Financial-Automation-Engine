const router = require('express').Router();
const auth = require('../middleware/auth');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// All routes require authentication
router.use(auth);

// @route   GET /api/data/export
// @desc    Export all user data
// @access  Private
router.get('/export', async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        let query = { userId: req.userId };
        if (user.businessId) {
            query = { businessId: user.businessId };
        }

        const [wallets, transactions] = await Promise.all([
            Wallet.find(query).select('-_id -__v -createdAt -updatedAt'),
            Transaction.find(query).select('-_id -__v -createdAt -updatedAt')
        ]);

        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
                wallets,
                transactions
            }
        };

        res.json(exportData);
    } catch (error) {
        console.error('Export data error:', error);
        res.status(500).json({ message: 'Server error during export' });
    }
});

// Import route removed as per request

module.exports = router;
