const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    avatar: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business'
    },
    lastActive: {
        type: Date
    },
    upiEnabled: {
        type: Boolean,
        default: false
    },
    generatedUPI: {
        type: String
    }
});

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Double check if it's already a bcrypt hash to avoid double hashing
        // (This can happen if some other logic also hashed it)
        const isAlreadyHashed = this.password.startsWith('$2a$') || this.password.startsWith('$2b$');
        if (isAlreadyHashed) return next();

        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('User', UserSchema);
