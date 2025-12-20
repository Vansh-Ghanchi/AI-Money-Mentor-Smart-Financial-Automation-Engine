const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    partners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    logo: {
        type: String, // Store as Base64 string
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Business', BusinessSchema);
