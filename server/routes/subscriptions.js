const router = require('express').Router();
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/subscriptions
// @desc    Get all subscriptions for logged-in user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ userId: req.userId }).sort({ nextDate: 1 });
        res.json(subscriptions);
    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/subscriptions
// @desc    Create new subscription
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { name, amount, frequency, nextDate, category } = req.body;

        // Validation
        if (!name || !amount || !frequency || !nextDate || !category) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Create subscription
        const subscription = new Subscription({
            userId: req.userId,
            name,
            amount,
            frequency,
            nextDate,
            category,
            active: true
        });

        await subscription.save();
        res.status(201).json(subscription);
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/subscriptions/:id
// @desc    Update subscription
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ _id: req.params.id, userId: req.userId });

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        // Update subscription
        Object.assign(subscription, req.body);
        await subscription.save();

        res.json(subscription);
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/subscriptions/:id
// @desc    Delete subscription
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ _id: req.params.id, userId: req.userId });

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        await subscription.deleteOne();
        res.json({ message: 'Subscription deleted' });
    } catch (error) {
        console.error('Delete subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
