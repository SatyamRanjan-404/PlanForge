const errorHandler = (err, req, res, next) => {
    console.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
        stack: err.stack
    });
    
    // Fallback status code
    const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.status(statusCode).json({
        success: false,
        error: isProduction ? (statusCode === 500 ? 'Internal Server Error' : err.message) : err.message,
        ...(isProduction ? {} : { stack: err.stack })
    });
};

module.exports = errorHandler;


