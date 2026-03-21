const mongoose = require('mongoose');

const uri = "mongodb+srv://rathoddvansh28_db_user:TWISHAYANAVANSH@cluster0.upnosh6.mongodb.net/expensetracker?retryWrites=true&w=majority";

console.log("Testing connection...");
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("Connected to MongoDB Successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
