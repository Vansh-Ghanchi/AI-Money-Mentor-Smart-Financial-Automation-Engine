const router = require('express').Router();
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/transactions
// @desc    Get all transactions for logged-in user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const User = require('../models/User'); // Import User
        const user = await User.findById(req.userId);

        let query = { userId: req.userId };
        if (user.businessId) {
            // If user belongs to a business, show ALL business transactions
            query = { businessId: user.businessId };
        }

        const transactions = await Transaction.find(query)
            .populate('addedBy', 'name') // Populate the name of who added it
            .sort({ date: -1 });

        res.json(transactions);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { amount, description, category, walletId, date, type, mood } = req.body;

        // Validation
        if (!amount || !category || !walletId || !type) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Fetch user to check business status
        const User = require('../models/User');
        const user = await User.findById(req.userId);

        // Create transaction
        const transaction = new Transaction({
            userId: req.userId,
            businessId: user.businessId || undefined,
            addedBy: req.userId,
            amount,
            description,
            category,
            walletId,
            date: date || new Date(),
            type,
            mood: mood || 'neutral'
        });

        await transaction.save();

        // Populate addedBy for immediate attribution in UI
        await transaction.populate('addedBy', 'name');

        // Update wallet balance
        const wallet = await Wallet.findOne({ userId: req.userId, id: walletId });
        if (wallet) {
            if (type === 'income') {
                wallet.balance += amount;
            } else if (type === 'expense') {
                wallet.balance -= amount;
            } else if (type === 'transfer') {
                wallet.balance -= amount;

                // Update destination wallet for transfer
                if (req.body.toWalletId) {
                    const toWallet = await Wallet.findOne({ userId: req.userId, id: req.body.toWalletId });
                    if (toWallet) {
                        toWallet.balance += amount;
                        await toWallet.save();
                    }
                }
            }
            await wallet.save();
        }

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.userId);

        let query = { _id: req.params.id };
        if (user.businessId) {
            query.businessId = user.businessId;
        } else {
            query.userId = req.userId;
        }

        const transaction = await Transaction.findOne(query);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found or unauthorized' });
        }

        // Rule A: 24-Hour Edit Lock
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const isLocked = (Date.now() - new Date(transaction.createdAt).getTime()) > twentyFourHours;

        if (isLocked) {
            return res.status(403).json({ message: 'This transaction is older than 24 hours and is locked for security. Please contact Admin for changes.' });
        }

        const oldAmount = transaction.amount;
        const newAmount = req.body.amount !== undefined ? Number(req.body.amount) : oldAmount;
        const oldType = transaction.type;
        const newType = req.body.type || oldType;

        // Rule B: Record "Before vs After" in modifiedLogs if amount changed
        if (newAmount !== oldAmount) {
            transaction.modifiedLogs.push({
                previousAmount: oldAmount,
                newAmount: newAmount,
                modifiedAt: new Date(),
                modifiedBy: req.userId
            });
        }

        // Rule C: Precise Wallet Balance Correction
        if (newAmount !== oldAmount || newType !== oldType || req.body.walletId !== transaction.walletId) {
            const wallet = await Wallet.findOne({ userId: req.userId, id: transaction.walletId });
            if (wallet) {
                // Reverse old transaction effect
                if (oldType === 'income') {
                    wallet.balance -= oldAmount;
                } else if (oldType === 'expense' || oldType === 'transfer') {
                    wallet.balance += oldAmount;
                }

                // Apply new transaction effect (if same wallet)
                if (!req.body.walletId || req.body.walletId === transaction.walletId) {
                    if (newType === 'income') {
                        wallet.balance += newAmount;
                    } else if (newType === 'expense' || newType === 'transfer') {
                        wallet.balance -= newAmount;
                    }
                    await wallet.save();
                } else {
                    // Changing wallets entirely
                    await wallet.save(); // Save the reversed balance
                    const newWallet = await Wallet.findOne({ userId: req.userId, id: req.body.walletId });
                    if (newWallet) {
                        if (newType === 'income') {
                            newWallet.balance += newAmount;
                        } else if (newType === 'expense' || newType === 'transfer') {
                            newWallet.balance -= newAmount;
                        }
                        await newWallet.save();
                    }
                }
            }
        }

        // Update transaction fields
        Object.assign(transaction, req.body);
        await transaction.save();

        // Populate for attribution display
        await transaction.populate('addedBy', 'name');

        res.json(transaction);
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.userId);

        let query = { _id: req.params.id };
        if (user.businessId) {
            query.businessId = user.businessId;
        } else {
            query.userId = req.userId;
        }

        const transaction = await Transaction.findOne(query);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found or unauthorized' });
        }

        // Reverse wallet balance change
        const wallet = await Wallet.findOne({ userId: req.userId, id: transaction.walletId });
        if (wallet) {
            if (transaction.type === 'income') {
                wallet.balance -= transaction.amount;
            } else if (transaction.type === 'expense') {
                wallet.balance += transaction.amount;
            } else if (transaction.type === 'transfer') {
                wallet.balance += transaction.amount;

                // Reverse destination wallet for transfer
                if (transaction.toWalletId) {
                    const toWallet = await Wallet.findOne({ userId: req.userId, id: transaction.toWalletId });
                    if (toWallet) {
                        toWallet.balance -= transaction.amount;
                        await toWallet.save();
                    }
                }
            }
            await wallet.save();
        }

        await transaction.deleteOne();

        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
