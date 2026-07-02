const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Security middleware assignments
const verify = require('../middleware/verifyToken'); 
const verifyAdmin = require('../middleware/verifyAdmin'); 

    /**
     * GET USER PROFILE
     * Retrieves complete authenticated user context and populates related course nodes.
     */
    router.get('/profile', verify, async (req, res) => {
        try {
            const user = await User.findById(req.user._id).select('-password').populate('enrolledCourses');
            if (!user) return res.status(404).send({ message: 'User not found' });
            res.send(user);
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });

    /**
     * REFRESH PROFILE DATA
     * Dispatches real-time session updates to sync state data within the client application.
     */
    router.get('/profile-refresh', verify, async (req, res) => {
        try {
            const user = await User.findById(req.user._id).select('-password');
            res.send({ user });
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });

    /**
     * UPDATE AVATAR
     * Decodes header authorization schemas and updates persistent binary/base64 avatar matrices.
     */
    router.put('/update-avatar', async (req, res) => {
        try {
            const authHeader = req.headers.authorization || req.headers['auth-token'];
            if (!authHeader) {
                return res.status(401).send({ message: 'Authorization vector missing.' });
            }

            let token = authHeader;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }

            const jwtSecret = process.env.SECRET_TOKEN; 
            if (!jwtSecret) {
                return res.status(500).send({ message: 'Internal server configuration breakdown.' });
            }

            const decoded = jwt.verify(token, jwtSecret);
            const userId = decoded.id || decoded._id || decoded.userId;
            const user = await User.findById(userId);
            if (!user) return res.status(404).send({ message: 'User identity not found.' });

            user.avatar = req.body.avatar;
            await user.save();

            const updatedUser = user.toObject();
            delete updatedUser.password;

            return res.status(200).send({
                message: 'Avatar update transaction committed successfully!',
                user: updatedUser
            });
        } catch (err) {
            return res.status(403).send({ message: `Forbidden tracking: ${err.message}` });
        }
    });

    /**
     * GRANT BADGE (Administrative access required)
     * Appends a new achievement string allocation securely onto the target user document.
     */
    router.patch('/:id/grant-badge', [verify, verifyAdmin], async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }

            // Initialize badges schema property fallback for legacy database records
            if (!user.badges) {
                user.badges = [];
            }

            const targetBadge = req.body.badgeName;
            if (!targetBadge) {
                return res.status(400).send({ message: "Payload error: badgeName field is required." });
            }

            // Apply badge sequence mutation if record duplication check satisfies validation
            if (!user.badges.includes(targetBadge)) {
                user.badges.push(targetBadge);

                // Cascade architecture dependency resolution rule mapping
                if (targetBadge === "Elite Champion" && !user.badges.includes("Knowledge Seeker")) {
                    user.badges.push("Knowledge Seeker");
                }

                await user.save();
            }

            const updatedUser = user.toObject();
            delete updatedUser.password;

            return res.send({ 
                message: 'Badge granted successfully', 
                badges: user.badges,
                user: updatedUser 
            });

        } catch (err) { 
            console.error("CRITICAL MONGOOSE ERROR:", err.message);
            return res.status(400).send({ message: err.message }); 
        }
    });

    /**
     * REVOKE BADGE (Administrative access required)
     * Removes an achievement string allocation from the target user document and enforces reverse cascading rules.
     */
    router.patch('/:id/revoke-badge', [verify, verifyAdmin], async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).send({ message: 'User not found' });
        
            const targetBadge = req.body.badgeName;
            if (!targetBadge) {
                return res.status(400).send({ message: "Payload error: badgeName field is required." });
            }
        
            // Remove the badge allocation using an array exclusion filter if present
            if (user.badges && user.badges.includes(targetBadge)) {
                user.badges = user.badges.filter(b => b !== targetBadge);
                
                // Reverse cascade dependency resolution rule mapping
                if (targetBadge === "Knowledge Seeker") {
                    user.badges = user.badges.filter(b => b !== "Elite Champion");
                }
            
                await user.save();
            }
        
            const updatedUser = user.toObject();
            delete updatedUser.password;
        
            return res.send({ 
                message: 'Badge revoked successfully', 
                badges: user.badges,
                user: updatedUser 
            });
        } catch (err) { 
            console.error("CRITICAL MONGOOSE ERROR:", err.message);
            return res.status(400).send({ message: err.message }); 
        }
    });
    
module.exports = router;