const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
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
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true
    },
    walletId: {
        type: String,
        required: true
    },
    toWalletId: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['income', 'expense', 'transfer'],
        required: true
    },
    mood: {
        type: String,
        enum: ['happy', 'neutral', 'sad'],
        default: 'neutral'
    },
    modifiedLogs: [{
        previousAmount: Number,
        newAmount: Number,
        modifiedAt: { type: Date, default: Date.now },
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', TransactionSchema);
