require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const healthRoutes = require('./routes/health');
const taskRoutes = require('./routes/tasks');

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

// Global Exception Process Handlers
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Request Logging via Winston
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());

// Strict CORS Lockdown for allowed origins
const allowedOrigins = process.env.FRONTEND_CLIENT_URL
  ? process.env.FRONTEND_CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, backend tests) or matching origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy violation: Origin ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Global Rate Limiting
app.use(globalLimiter);

// Routes
app.use('/health', healthRoutes);
app.use('/tasks', taskRoutes);

// Global Error Handler (MUST BE LAST)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize Server
const startServer = async () => {
    await connectDB();
    await connectRedis();

    app.listen(PORT, () => {
        logger.info(`Orchestrator Backend running on port ${PORT}`);
    });
};

if (require.main === module) {
    startServer();
}

module.exports = app;

