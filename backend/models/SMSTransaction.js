const mongoose = require('mongoose');

const SMSTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        index: true
    },
    // Raw SMS data
    smsBody: {
        type: String,
        required: true
    },
    smsFrom: {
        type: String,
        required: true
    },
    smsTimestamp: {
        type: Date,
        required: true
    },
    // Parsed transaction data
    amount: {
        type: Number,
        required: true
    },
    merchantName: {
        type: String,
        trim: true
    },
    paymentApp: {
        type: String,
        enum: ['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'Amazon Pay', 'Cred Pay', 'Freecharge', 'Mobikwik', 'Tata Neu UPI', 'WhatsApp Pay', 'FanPay', 'Other'],
    },
    smsTransactionId: {
        type: String,
        trim: true
    },
    // User confirmation status
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected', 'expired'],
        default: 'pending'
    },
    // User's choice when confirming
    confirmedType: {
        type: String,
        enum: ['income', 'expense'],
    },
    confirmedDescription: {
        type: String,
        trim: true
    },
    confirmedCategory: {
        type: String,
        trim: true
    },
    confirmedWalletId: {
        type: String,
        trim: true
    },
    // Reference to created transaction (if confirmed)
    createdTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    // Expiry time for pending confirmations (24 hours)
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
}, {
    timestamps: true
});

// Index for auto-expiring pending transactions
SMSTransactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SMSTransaction', SMSTransactionSchema);
