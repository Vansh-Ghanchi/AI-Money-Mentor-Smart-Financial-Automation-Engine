const router = require('express').Router();
const Business = require('../models/Business');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/business/me
// @desc    Get current user's business details
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user.businessId) {
            return res.status(404).json({ message: 'No business found for this user' });
        }

        const business = await Business.findById(user.businessId).populate('partners', 'name email lastActive');
        res.json(business);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
// @route   PUT /api/business/logo
// @desc    Update business logo
// @access  Private
router.put('/logo', auth, async (req, res) => {
    try {
        const { logo } = req.body;
        const user = await User.findById(req.userId);

        if (!user.businessId) {
            return res.status(404).json({ message: 'No business found' });
        }

        const business = await Business.findByIdAndUpdate(
            user.businessId,
            { logo },
            { new: true }
        );

        res.json(business);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/business/logo
// @desc    Remove business logo
// @access  Private
router.delete('/logo', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user.businessId) {
            return res.status(404).json({ message: 'No business found' });
        }

        const business = await Business.findByIdAndUpdate(
            user.businessId,
            { $unset: { logo: "" } },
            { new: true }
        );

        res.json(business);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
