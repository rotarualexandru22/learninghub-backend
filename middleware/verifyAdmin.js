/**
 * Middleware to check if the authenticated user has an 'admin' role.
 * This should be used AFTER the verifyToken middleware.
 */
module.exports = function(req, res, next) {
    // Check if the user object exists (attached by verifyToken) and has the admin role
    if (req.user && req.user.role === 'admin') {
        next(); // User is admin, proceed to the route
    } else {
        // Access denied (403 Forbidden)
        return res.status(403).send({ message: 'Access denied! Admin rights required.' });
    }
}; 