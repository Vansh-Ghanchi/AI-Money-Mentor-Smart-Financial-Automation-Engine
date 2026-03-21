const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const User = require('./models/User');
const Wallet = require('./models/Wallet');

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}, 'email name password businessId');

        const output = [];
        output.push(`Found ${users.length} users:`);

        for (const u of users) {
            const wallets = await Wallet.countDocuments({ userId: u._id });
            output.push(`- ${u.email} (${u.name})`);
            output.push(`  ID: ${u._id}`);
            output.push(`  Role: ${u.role}`);
            output.push(`  Password: ${u.password ? u.password.substring(0, 10) + '...' : 'NULL'}`);
            output.push(`  IsHash: ${u.password && (u.password.startsWith('$2a$') || u.password.startsWith('$2b$'))}`);
            output.push(`  Wallets: ${wallets}`);
            output.push('---');
        }

        fs.writeFileSync('users_dump.txt', output.join('\n'));
        console.log('Dumped to users_dump.txt');

    } catch (error) {
        console.error('Error:', error);
        fs.writeFileSync('users_dump.txt', `Error: ${error.message}`);
    } finally {
        await mongoose.disconnect();
    }
};

listUsers();
