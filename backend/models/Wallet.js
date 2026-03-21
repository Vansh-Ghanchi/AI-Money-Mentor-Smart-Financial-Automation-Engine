const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
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
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ['cash', 'bank', 'card', 'upi', 'online'],
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Wallet', WalletSchema);
