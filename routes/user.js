const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verify = require('../middleware/verifyToken');

/**
 * GET USER PROFILE
 * Returns public info about the logged-in user.
 */
router.get('/profile', verify, async (req, res) => {
    try {
        // Find user by ID (extracted from token) but exclude the password
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) return res.status(404).send({ message: 'User not found' });

        res.send(user);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

router.put('/update-avatar', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send({ message: 'Authorization vector missing.' });
        }

        const token = authHeader.split(' ')[1];

        // CORECTAT: Folosim exact cheia definită în fișierul tău .env!
        const jwtSecret = process.env.SECRET_TOKEN; 
        
        if (!jwtSecret) {
            console.error("CRITICAL ERROR: SECRET_TOKEN is undefined in .env");
            return res.status(500).send({ message: 'Internal server configuration breakdown.' });
        }

        // Decodificăm token-ul folosind cheia salvată global în producție
        const decoded = jwt.verify(token, jwtSecret);

        // Extragem ID-ul utilizatorului
        const userId = decoded.id || decoded._id || decoded.userId;
        if (!userId) {
            return res.status(403).send({ message: 'Token payload signature invalid.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({ message: 'User identity not found.' });
        }

        // Salvăm stringul Base64 decupat direct în MongoDB
        user.avatar = req.body.avatar;
        await user.save();

        // Pregătim obiectul de trimis înapoi în frontend fără parolă
        const updatedUser = user.toObject();
        delete updatedUser.password;

        console.log(`[Success] Avatar updated successfully for user: ${user.email}`);

        return res.status(200).send({
            message: 'Avatar update transaction committed successfully!',
            user: updatedUser
        });

    } catch (err) {
        console.error("Eroare la decodificare în user.js (update-avatar):", err.message);
        return res.status(403).send({ message: `Forbidden tracking: ${err.message}` });
    }
});

module.exports = router;