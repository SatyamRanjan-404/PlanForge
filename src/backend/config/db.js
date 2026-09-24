const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/orchestrator';
  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000, 
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected! Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully.');
    });

  } catch (error) {
    console.error(`MongoDB Connection Error (${uri}): ${error.message}`);
    
    // Try local fallback if primary URI fails
    if (uri !== 'mongodb://127.0.0.1:27017/orchestrator') {
      console.log('Attempting fallback to local MongoDB instance (127.0.0.1:27017)...');
      try {
        const fallbackConn = await mongoose.connect('mongodb://127.0.0.1:27017/orchestrator', {
          serverSelectionTimeoutMS: 3000
        });
        console.log(`MongoDB Connected via local fallback: ${fallbackConn.connection.host}`);
        return;
      } catch (fallbackErr) {
        console.error('Local fallback MongoDB connection also failed.');
      }
    }

    if (error.message && error.message.includes('IP')) {
      console.error('ACTION REQUIRED: Please whitelist your current IP address in your MongoDB Atlas Dashboard (Network Access -> Add IP Address).');
    }
    process.exit(1);
  }
};

module.exports = connectDB;

