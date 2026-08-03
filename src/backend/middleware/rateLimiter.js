const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    message: { success: false, error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true, 
    legacyHeaders: false, 
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, 
    message: { success: false, error: 'Too many attempts from this IP, please try again after 15 minutes' },
});

module.exports = {
    globalLimiter,
    authLimiter
};
