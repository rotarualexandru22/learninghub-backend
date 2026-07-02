const jwt = require('jsonwebtoken');

/**
 * Middleware function to protect private routes.
 * Validates the incoming JSON Web Token (JWT) from the auth-token header.
 */
module.exports = function(req, res, next) {
    const token = req.header('auth-token');
    
    if (!token) {
        return res.status(401).send({ message: 'Access denied! No token provided.' });
    }

    try {
        // Enforce a string check to prevent internal server crashes if token format is altered
        const tokenString = typeof token === 'string' && token.startsWith('Bearer ') 
            ? token.split(' ')[1] 
            : token;

        const verified = jwt.verify(tokenString, process.env.SECRET_TOKEN);
        
        // Attach decoded data payload to the central request pipeline
        req.user = verified;
        next();
    } catch (err) {
        // Retain the 400 status code to match existing frontend error interceptor conditions
        return res.status(400).send({ message: 'Invalid token!' });
    }
};