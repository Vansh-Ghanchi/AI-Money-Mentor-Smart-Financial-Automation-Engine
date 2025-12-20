const router = require('express').Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Business = require('../models/Business');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Apply auth and admin middleware to all routes
router.use(auth);
router.use(admin);

// @route   GET /api/admin/users
// @desc    Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/users/:userId/transactions
// @desc    Get transactions for a specific user
router.get('/users/:userId/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/stats
// @desc    Get platform statistics
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTransactions = await Transaction.countDocuments();

        // Get users created this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const newUsersThisMonth = await User.countDocuments({
            createdAt: { $gte: startOfMonth }
        });

        // Get active users (users with transactions in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeUserIds = await Transaction.distinct('userId', {
            date: { $gte: thirtyDaysAgo }
        });
        const activeUsers = activeUserIds.length;

        // Calculate total money tracked
        const allTransactions = await Transaction.find();
        const totalMoneyTracked = allTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

        // Average transactions per user
        const avgTransactionsPerUser = totalUsers > 0 ? (totalTransactions / totalUsers).toFixed(2) : 0;

        res.json({
            totalUsers,
            totalTransactions,
            newUsersThisMonth,
            activeUsers,
            totalMoneyTracked: totalMoneyTracked.toFixed(2),
            avgTransactionsPerUser
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/activity
// @desc    Get recent platform activity
router.get('/activity', async (req, res) => {
    try {
        // Retention Risk: Users older than 30 days with 0 transactions in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get users older than 30 days
        const establishedUsers = await User.find({
            createdAt: { $lt: thirtyDaysAgo },
            role: { $ne: 'admin' }
        }).select('name email createdAt');

        const retentionRisk = [];
        for (const user of establishedUsers) {
            const lastMonthTransactions = await Transaction.countDocuments({
                userId: user._id,
                date: { $gte: thirtyDaysAgo }
            });

            if (lastMonthTransactions === 0) {
                // Get last transaction for context
                const lastTx = await Transaction.findOne({ userId: user._id }).sort({ date: -1 });
                retentionRisk.push({
                    ...user.toObject(),
                    lastActive: lastTx ? lastTx.date : 'Never'
                });
            }
        }

        // Platform-wide Net Flow: Aggregate income vs expense for last 30 days
        const netFlowStats = await Transaction.aggregate([
            {
                $match: { date: { $gte: thirtyDaysAgo } }
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const inflow = netFlowStats.find(s => s._id === 'income')?.total || 0;
        const outflow = netFlowStats.find(s => s._id === 'expense')?.total || 0;

        // Get high-value transactions (> 10000)
        const highValueTransactions = await Transaction.find({
            amount: { $gt: 10000 }
        })
            .sort({ date: -1 })
            .limit(10)
            .populate('userId', 'name email');

        // Transaction Security Log: Last 10 modified transactions
        const securityLogs = await Transaction.find({
            'modifiedLogs.0': { $exists: true }
        })
            .sort({ updatedAt: -1 })
            .limit(10)
            .populate('userId', 'name email')
            .populate('modifiedLogs.modifiedBy', 'name');

        res.json({
            retentionRisk: retentionRisk.slice(0, 10),
            highValueTransactions,
            securityLogs,
            netFlow: {
                inflow,
                outflow,
                net: inflow - outflow
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/insights
// @desc    Get platform insights and analytics
router.get('/insights', async (req, res) => {
    try {
        // Category breakdown
        const categoryStats = await Transaction.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Transaction type breakdown
        const typeStats = await Transaction.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // User growth over last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const userGrowth = await User.aggregate([
            {
                $match: { createdAt: { $gte: sixMonthsAgo } }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Transaction volume over last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const transactionVolume = await Transaction.aggregate([
            {
                $match: { date: { $gte: thirtyDaysAgo } }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$date' }
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        res.json({
            categoryStats,
            typeStats,
            userGrowth,
            transactionVolume
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/users/metrics
// @desc    Get detailed user metrics
router.get('/users/metrics', async (req, res) => {
    try {
        const users = await User.find().select('-password');

        const userMetrics = await Promise.all(users.map(async (user) => {
            const transactionCount = await Transaction.countDocuments({ userId: user._id });
            const transactions = await Transaction.find({ userId: user._id });
            const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

            // Get last transaction date
            const lastTransaction = await Transaction.findOne({ userId: user._id })
                .sort({ date: -1 });

            return {
                ...user.toObject(),
                transactionCount,
                totalAmount: totalAmount.toFixed(2),
                lastActivity: lastTransaction ? lastTransaction.date : null
            };
        }));

        res.json(userMetrics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/businesses
// @desc    Get all businesses with metrics
router.get('/businesses', async (req, res) => {
    try {
        const businesses = await Business.find().populate('partners', 'name email');

        const businessMetrics = await Promise.all(businesses.map(async (business) => {
            const transactionCount = await Transaction.countDocuments({ businessId: business._id });
            const transactions = await Transaction.find({ businessId: business._id });
            const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const partnerCount = business.partners.length;

            return {
                ...business.toObject(),
                transactionCount,
                totalAmount: totalAmount.toFixed(2),
                partnerCount
            };
        }));

        res.json(businessMetrics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/businesses/:businessId/transactions
// @desc    Get transactions for a specific business
router.get('/businesses/:businessId/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find({ businessId: req.params.businessId })
            .populate('addedBy', 'name email')
            .sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/export/users
// @desc    Export users as CSV
router.get('/export/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');

        // Create CSV header
        let csv = 'Name,Email,Role,Join Date,ID\n';

        // Add user data
        users.forEach(user => {
            csv += `${user.name},${user.email},${user.role},${user.createdAt},${user._id}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
        res.send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/export/transactions
// @desc    Export all transactions as CSV
router.get('/export/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('userId', 'name email')
            .sort({ date: -1 });

        // Create CSV header
        let csv = 'Date,User,Email,Type,Category,Amount,Description\n';

        // Add transaction data
        transactions.forEach(t => {
            const userName = t.userId?.name || 'Unknown';
            const userEmail = t.userId?.email || 'Unknown';
            const description = (t.description || '').replace(/,/g, ';'); // Replace commas to avoid CSV issues

            csv += `${t.date},${userName},${userEmail},${t.type},${t.category},${t.amount},"${description}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        res.send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/export/users/pdf
// @desc    Export users as PDF with proper formatting
router.get('/export/users/pdf', async (req, res) => {
    try {
        const PDFDocument = require('pdfkit');
        const users = await User.find().select('-password');

        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=users.pdf');

        // Pipe PDF to response
        doc.pipe(res);

        // Title
        doc.fontSize(22).fillColor('#1E40AF').font('Helvetica-Bold')
            .text('User List Report', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(9).fillColor('#64748B').font('Helvetica')
            .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(1.5);

        // Table header
        const tableTop = doc.y;
        const col1X = 40;   // Name
        const col2X = 160;  // Email  
        const col3X = 350;  // Role
        const col4X = 450;  // Join Date

        // Header background
        doc.rect(col1X, tableTop, 515, 25).fillAndStroke('#3B82F6', '#3B82F6');

        // Header text
        doc.fontSize(10).fillColor('#FFFFFF').font('Helvetica-Bold');
        doc.text('Name', col1X + 5, tableTop + 8);
        doc.text('Email', col2X + 5, tableTop + 8);
        doc.text('Role', col3X + 5, tableTop + 8);
        doc.text('Join Date', col4X + 5, tableTop + 8);

        let yPosition = tableTop + 30;

        // Table rows
        doc.font('Helvetica').fontSize(9);
        users.forEach((user, index) => {
            // Check for new page
            if (yPosition > 750) {
                doc.addPage();
                yPosition = 40;
            }

            // Alternate row background
            if (index % 2 === 0) {
                doc.rect(col1X, yPosition - 2, 515, 18).fill('#F1F5F9');
            }

            // Row data
            doc.fillColor('#000000');
            doc.text(user.name.substring(0, 25), col1X + 5, yPosition);
            doc.text(user.email.substring(0, 35), col2X + 5, yPosition);
            doc.text(user.role, col3X + 5, yPosition);
            doc.text(new Date(user.createdAt).toLocaleDateString('en-US'), col4X + 5, yPosition);

            yPosition += 20;
        });

        // Footer
        doc.moveDown(2);
        const footerY = yPosition + 20;
        doc.rect(col1X, footerY, 515, 2).fill('#3B82F6');
        doc.fontSize(11).fillColor('#3B82F6').font('Helvetica-Bold');
        doc.text(`Total Users: ${users.length}`, { align: 'center', y: footerY + 10 });

        doc.end();
    } catch (error) {
        console.error('PDF Export Error:', error);
        res.status(500).json({ message: 'Server error generating PDF' });
    }
});

// @route   GET /api/admin/export/transactions/pdf
// @desc    Export all transactions as PDF with proper formatting
router.get('/export/transactions/pdf', async (req, res) => {
    try {
        const PDFDocument = require('pdfkit');
        const transactions = await Transaction.find()
            .populate('userId', 'name email')
            .sort({ date: -1 })
            .limit(100); // Limit to prevent huge PDFs

        const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.pdf');

        // Pipe PDF to response
        doc.pipe(res);

        // Title
        doc.fontSize(22).fillColor('#1E40AF').font('Helvetica-Bold')
            .text('Transaction Report', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(9).fillColor('#64748B').font('Helvetica')
            .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.fontSize(8).fillColor('#64748B').text('(Showing latest 100 transactions)', { align: 'center' });
        doc.moveDown(1.5);

        // Table header
        const tableTop = doc.y;
        const col1X = 40;   // Date
        const col2X = 120;  // User
        const col3X = 220;  // Type
        const col4X = 280;  // Category
        const col5X = 380;  // Amount (Adjusted for better spacing)
        const col6X = 440;  // Description

        // Header background
        doc.rect(col1X, tableTop, 760, 25).fillAndStroke('#3B82F6', '#3B82F6');

        // Header text
        doc.fontSize(10).fillColor('#FFFFFF').font('Helvetica-Bold');
        doc.text('Date', col1X + 5, tableTop + 8);
        doc.text('User', col2X + 5, tableTop + 8);
        doc.text('Type', col3X + 5, tableTop + 8);
        doc.text('Category', col4X + 5, tableTop + 8);
        doc.text('Amount', col5X + 5, tableTop + 8);
        doc.text('Description', col6X + 5, tableTop + 8);

        let yPosition = tableTop + 30;
        let totalAmount = 0;

        // Table rows
        doc.font('Helvetica').fontSize(9);
        transactions.forEach((t, index) => {
            // Check for new page
            if (yPosition > 500) {
                doc.addPage();
                yPosition = 40;
            }

            // Alternate row background
            if (index % 2 === 0) {
                doc.rect(col1X, yPosition - 2, 760, 18).fill('#F1F5F9');
            }

            const userName = t.userId?.name || 'Unknown';
            const description = (t.description || '').substring(0, 45);
            const amountColor = t.type === 'income' ? '#16A34A' : '#DC2626';

            // Row data
            doc.fillColor('#000000');
            doc.text(new Date(t.date).toLocaleDateString(), col1X + 5, yPosition);
            doc.text(userName.substring(0, 15), col2X + 5, yPosition);
            doc.text(t.type, col3X + 5, yPosition);
            doc.text(t.category.substring(0, 12), col4X + 5, yPosition);

            doc.fillColor(amountColor);
            // Using "Rs." instead of symbol to avoid font issues
            doc.text(`Rs. ${t.amount}`, col5X + 5, yPosition);

            doc.fillColor('#000000');
            doc.text(description, col6X + 5, yPosition);

            totalAmount += parseFloat(t.amount);
            yPosition += 20;
        });

        // Footer
        doc.moveDown(2);
        const footerY = yPosition + 20;

        // Footer background
        doc.rect(col1X, footerY, 760, 30).fill('#F1F5F9');
        doc.rect(col1X, footerY, 760, 30).stroke('#3B82F6');

        // Footer text - Left aligned summary
        doc.fontSize(10).fillColor('#1E40AF').font('Helvetica-Bold');
        doc.text(`Total Transactions: ${transactions.length}`, col1X + 10, footerY + 10);

        // Footer text - Right aligned total amount
        doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, col1X + 600, footerY + 10, { width: 150, align: 'right' });

        doc.end();
    } catch (error) {
        console.error('PDF Export Error:', error);
        res.status(500).json({ message: 'Server error generating PDF' });
    }
});

module.exports = router;
