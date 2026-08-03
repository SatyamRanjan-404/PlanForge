require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

// Import Agents
const startPlanner = require('./agents/planner');
const startExecutor = require('./agents/executor');
const startValidator = require('./agents/validator');

const startWorkers = async () => {
    console.log('Starting Background Worker Daemon...');
    
    // Ensure we are connected to DB globally for Mongoose
    await connectDB();
    await connectRedis();

    // Start blocking loops. 
    // They run asynchronously and infinitely to process tasks.
    startPlanner();
    startExecutor();
    startValidator();
    
    console.log('All LangChain Agent Daemons are now listening to queues.');
};

startWorkers();
