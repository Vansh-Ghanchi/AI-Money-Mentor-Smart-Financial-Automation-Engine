const router = require('express').Router();
const SMSTransaction = require('../models/SMSTransaction');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   POST /api/sms-transactions/parse
// @desc    Parse and store SMS transaction data
// @access  Private
router.post('/parse', async (req, res) => {
    try {
        const { smsBody, smsFrom, smsTimestamp } = req.body;

        if (!smsBody || !smsFrom) {
            return res.status(400).json({ message: 'SMS body and sender are required' });
        }

        // Parse SMS to extract transaction details
        const parsedData = parseSMS(smsBody, smsFrom);

        if (!parsedData) {
            return res.status(400).json({ message: 'Please fill a valid payment app' });
        }

        if (!parsedData.amount) {
            return res.status(400).json({ message: 'Could not extract transaction amount from SMS' });
        }

        // Fetch user to check business status and toggle status
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // STRICT VALIDATION:
        // 1. Authentication must be via a valid Tracking UPI (not your legacy login token)
        if (!req.isUPI) {
            return res.status(401).json({
                message: 'AUTHENTICATION REQUIRED: Please copy your "Tracking UPI" from Payment Automation settings and paste it into the tester to save transaction history.'
            });
        }

        // 2. The "UPI Payment Tracking" toggle must be turned ON in Settings
        if (!user.upiEnabled) {
            return res.status(403).json({
                message: 'TRACKING BLOCKED: UPI Payment Tracking is currently turned OFF in your settings. Please turn it ON to save data.'
            });
        }

        const smsTransaction = new SMSTransaction({
            userId: req.userId,
            businessId: user.businessId || undefined,
            smsBody,
            smsFrom,
            smsTimestamp: smsTimestamp || new Date(),
            amount: parsedData.amount,
            merchantName: parsedData.merchantName,
            paymentApp: parsedData.paymentApp,
            smsTransactionId: parsedData.transactionId,
            status: 'pending',
            confirmedType: parsedData.type // Pre-suggest the detected type
        });

        await smsTransaction.save();

        res.status(201).json({
            message: 'SMS transaction parsed successfully and waiting for confirmation in the app.',
            smsTransaction
        });
    } catch (error) {
        console.error('Parse SMS error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/sms-transactions/pending
// @desc    Get all pending SMS transactions for user
// @access  Private
router.get('/pending', async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.userId);

        let query = { userId: req.userId, status: 'pending' };
        if (user.businessId) {
            query = { businessId: user.businessId, status: 'pending' };
        }

        const pendingTransactions = await SMSTransaction.find(query)
            .sort({ smsTimestamp: -1 });

        res.json(pendingTransactions);
    } catch (error) {
        console.error('Get pending SMS transactions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/sms-transactions/:id/confirm
// @desc    Confirm SMS transaction and create actual transaction
// @access  Private
router.post('/:id/confirm', async (req, res) => {
    try {
        const { type, description, category, walletId } = req.body;

        if (!type || !category || !walletId) {
            return res.status(400).json({ message: 'Type, category, and wallet are required' });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let query = { _id: req.params.id, status: 'pending' };
        if (user.businessId) {
            query.businessId = user.businessId;
        } else {
            query.userId = req.userId;
        }

        const smsTransaction = await SMSTransaction.findOne(query);

        if (!smsTransaction) {
            return res.status(404).json({ message: 'SMS transaction not found or already processed' });
        }

        // Find the "Online" wallet for this user
        let walletQuery = { name: { $regex: new RegExp('^Online$', 'i') } };
        if (user.businessId) {
            walletQuery.businessId = user.businessId;
        } else {
            walletQuery.userId = req.userId;
        }

        const onlineWallet = await Wallet.findOne(walletQuery);
        // Use the custom string ID field, not the MongoDB _id
        const finalWalletId = onlineWallet ? onlineWallet.get('id') : walletId;

        // Create actual transaction
        const transaction = new Transaction({
            userId: req.userId,
            businessId: user.businessId || undefined,
            addedBy: req.userId,
            amount: smsTransaction.amount,
            description: description || smsTransaction.merchantName || 'SMS Payment',
            category,
            walletId: finalWalletId,
            date: smsTransaction.smsTimestamp,
            type,
            mood: 'neutral'
        });

        await transaction.save();
        await transaction.populate('addedBy', 'name');

        // Update wallet balance
        let balanceWalletQuery = { id: finalWalletId };
        if (user.businessId) {
            balanceWalletQuery.businessId = user.businessId;
        } else {
            balanceWalletQuery.userId = req.userId;
        }

        const wallet = await Wallet.findOne(balanceWalletQuery);
        if (wallet) {
            if (type === 'income') {
                wallet.balance += smsTransaction.amount;
            } else if (type === 'expense') {
                wallet.balance -= smsTransaction.amount;
            }
            await wallet.save();
        }

        // Update SMS transaction status
        smsTransaction.status = 'confirmed';
        smsTransaction.confirmedType = type;
        smsTransaction.confirmedDescription = description;
        smsTransaction.confirmedCategory = category;
        smsTransaction.confirmedWalletId = finalWalletId;
        smsTransaction.createdTransactionId = transaction._id;
        await smsTransaction.save();

        res.json({
            message: 'Transaction confirmed successfully',
            transaction,
            smsTransaction
        });
    } catch (error) {
        console.error('Confirm SMS transaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/sms-transactions/:id/reject
// @desc    Reject SMS transaction
// @access  Private
router.post('/:id/reject', async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let query = { _id: req.params.id, status: 'pending' };
        if (user.businessId) {
            query.businessId = user.businessId;
        } else {
            query.userId = req.userId;
        }

        const smsTransaction = await SMSTransaction.findOne(query);

        if (!smsTransaction) {
            return res.status(404).json({ message: 'SMS transaction not found or already processed' });
        }

        smsTransaction.status = 'rejected';
        await smsTransaction.save();

        res.json({ message: 'Transaction rejected successfully' });
    } catch (error) {
        console.error('Reject SMS transaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to parse SMS
function parseSMS(smsBody, smsFrom) {
    const result = {
        amount: null,
        merchantName: null,
        paymentApp: null,
        type: 'expense' // Default type
    };

    const lowerBody = smsBody.toLowerCase();
    const lowerFrom = smsFrom.toLowerCase();

    // 1. Detect Transaction Type (Income vs Expense)
    // Credit-related words (received, receive, refund, etc.) -> Income (+)
    const incomeKeywords = ['received', 'receive', 'credited', 'added', 'deposited', 'salary', 'income', 'refund', 'cashback'];
    // Debit-related words (paid, debited, etc.) -> Expense (-)
    const expenseKeywords = ['paid', 'debited', 'spent', 'sent', 'payment to', 'transfer to'];

    if (incomeKeywords.some(keyword => lowerBody.includes(keyword))) {
        result.type = 'income';
    } else if (expenseKeywords.some(keyword => lowerBody.includes(keyword))) {
        result.type = 'expense';
    }

    // 2. Detect payment app (Strict List)
    const apps = {
        'Google Pay': ['google pay', 'googlepay', 'gpay'],
        'PhonePe': ['phonepe'],
        'Paytm': ['paytm'],
        'BHIM UPI': ['bhim'],
        'Amazon Pay': ['amazon pay', 'amazonpay'],
        'Cred Pay': ['cred'],
        'Freecharge': ['freecharge'],
        'Mobikwik': ['mobikwik'],
        'Tata Neu UPI': ['tata neu', 'tata'],
        'WhatsApp Pay': ['whatsapp'],
        'FanPay': ['fanpay']
    };

    let detectedApp = null;
    for (const [appName, keywords] of Object.entries(apps)) {
        if (keywords.some(k => lowerBody.includes(k) || lowerFrom.includes(k))) {
            detectedApp = appName;
            break;
        }
    }

    if (!detectedApp) {
        return null; // Signals validation failure to the route
    }
    result.paymentApp = detectedApp;

    // 3. Extract amount
    const amountPatterns = [
        /(?:rs\.?\s*|inr\s*|₹\s*)(\d+(?:,\d+)*(?:\.\d{2})?)/i,
        /(\d+(?:,\d+)*(?:\.\d{2})?)\s*(?:rs|inr|rupees|received|paid|debited|credited|spent|credited)/i,
        /(?:amount:?\s*)(\d+(?:,\d+)*(?:\.\d{2})?)/i,
        /(\d+(?:,\d+)*(?:\.\d{2})?)/ // Fallback to first number found if it's a very simple SMS
    ];

    for (const pattern of amountPatterns) {
        const match = smsBody.match(pattern);
        if (match) {
            result.amount = parseFloat(match[1].replace(/,/g, ''));
            break;
        }
    }

    // 4. Extract merchant/sender name
    const merchantPatterns = [
        /(?:to|from|at|paid to|received from)\s+([A-Za-z0-9\s&.-]+?)(?:\s+on|\s+for|\s+via|\.|\s+Rs)/i,
        /merchant:\s*([A-Za-z0-9\s&.-]+)/i
    ];

    for (const pattern of merchantPatterns) {
        const match = smsBody.match(pattern);
        if (match) {
            result.merchantName = match[1].trim();
            break;
        }
    }

    // 5. Extract transaction ID
    const txnPatterns = [
        /(?:txn|transaction|ref|reference)(?:\s*id)?[:\s]+([A-Z0-9]+)/i,
        /utr[:\s]+([A-Z0-9]+)/i
    ];

    for (const pattern of txnPatterns) {
        const match = smsBody.match(pattern);
        if (match) {
            result.transactionId = match[1];
            break;
        }
    }

    return result;
}

module.exports = router;
