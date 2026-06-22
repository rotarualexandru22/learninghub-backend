const jwt = require('jsonwebtoken');

/**
 * Middleware function to protect private routes
 * It checks for the 'auth-token' header and verifies the JWT
 */
module.exports = function(req, res, next) {
    // Get the token from the request header
    const token = req.header('auth-token');
    
    // If no token is provided, deny access (401 Unauthorized)
    if (!token) {
        return res.status(401).send({ message: 'Access denied! No token provided.' });
    }

    try {
        // Verify the token using our secret key from .env
        const verified = jwt.verify(token, process.env.SECRET_TOKEN);
        
        // Attach the verified user data (id and role) to the request object
        req.user = verified;
        
        // Move to the next function/middleware in the stack
        next();
    } catch (err) {
        // If the token is invalid or expired (400 Bad Request)
        res.status(400).send({ message: 'Invalid token!' });
    }
};