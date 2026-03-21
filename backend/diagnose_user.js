const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Business = require('./models/Business');

const diagnose = async () => {
    try {
        console.log('Connecting to MongoDB...');
        console.log('URI:', process.env.MONGODB_URI ? 'Defined' : 'Undefined');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const email = 'dmmm@gmail.com';
        console.log(`Looking for user: ${email}`);

        const user = await User.findOne({ email }).populate('businessId', 'name logo');

        if (!user) {
            console.log('User not found.');
        } else {
            console.log('User found:');
            console.log('ID:', user._id);
            console.log('Name:', user.name);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('Password Hash starts with:', user.password ? user.password.substring(0, 10) : 'No password');
            console.log('Business:', user.businessId);

            console.log('Checking Wallets...');
            const wallets = await Wallet.find({ userId: user._id });
            console.log(`Found ${wallets.length} wallets.`);
            wallets.forEach(w => console.log(`- ${w.name} (${w.type}): ${w.balance}`));
        }

    } catch (error) {
        console.error('Diagnosis Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
};

diagnose();
