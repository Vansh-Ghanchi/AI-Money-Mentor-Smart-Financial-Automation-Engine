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
            // Return a default structure for users without a business
            return res.json({ name: 'Personal Account', partners: [user], logo: user.avatar || null });
        }

        const business = await Business.findById(user.businessId).populate('partners', 'name email lastActive createdAt');
        if (!business) {
            return res.json({ name: 'Personal Account', partners: [user], logo: user.avatar || null });
        }
        res.json(business);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/business/logo
// @desc    Update business logo (Creates business if missing)
// @access  Private
router.put('/logo', auth, async (req, res) => {
    try {
        const { logo } = req.body;
        let user = await User.findById(req.userId);

        if (!user.businessId) {
            // Automatically create a "Business" for single users so they can have a logo
            const newBusiness = new Business({
                name: `${user.name}'s Personal`,
                partners: [user._id],
                logo: logo
            });
            await newBusiness.save();

            user.businessId = newBusiness._id;
            await user.save();

            return res.json(newBusiness);
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
            return res.json({ message: 'No logo to remove' });
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
