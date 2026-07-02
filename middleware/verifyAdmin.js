/**
 * Middleware to verify if the authenticated user has an administrative role.
 * Executed sequentially after token validation.
 */
module.exports = function(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next(); 
    } else {
        return res.status(403).send({ message: 'Access denied! Admin rights required.' });
    }
};