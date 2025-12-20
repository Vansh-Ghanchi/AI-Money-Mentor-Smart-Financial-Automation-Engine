const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('✅ MongoDB Connected Successfully');
        console.log(`📦 Database: ${conn.connection.host}`);

        // Handle MongoDB connection events
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected successfully');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB error:', err.message);
        });

    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        console.error('⚠️  Retrying connection in 5 seconds...');

        // Retry connection after 5 seconds
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;
