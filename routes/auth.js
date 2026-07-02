const jwt = require("jsonwebtoken");
const verify = require("../middleware/verifyToken");
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { registerValidation } = require('../middleware/validation');
const bcrypt = require("bcryptjs");


    // DATABASE REGISTER ROUTE
    router.post('/register', async (req, res) => {
        // 1. Validate data structures using Joi validation engine
        const { error } = registerValidation(req.body);
        if (error) return res.status(400).send({ message: error.details[0].message });

        try {
            // 2. Check strict database integrity for duplicates (Email & Username)
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists) return res.status(400).send({ message: 'E-mail already exists!' });

            const userExists = await User.findOne({ username: req.body.username });
            if (userExists) return res.status(400).send({ message: 'This username is already taken!' });

            // 3. Create persistent user model object configuration instance
            const user = new User({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                username: req.body.username,
                email: req.body.email,
                password: req.body.password, // Direct assign - verification model assumes password pre-hashing inside User Schema or explicit pre-save triggers
                role: req.body.role || 'user'
            });

            const savedUser = await user.save();
            return res.status(201).send({ 
                message: 'User created successfully!', 
                userId: savedUser._id 
            });
        } catch (err) {
            return res.status(500).send({ message: err.message });
        }
    });

    // DATABASE LOGIN ROUTE
    router.post('/login', async (req, res) => {
        try {
            // 1. Verify if the target user profile identity exists in MongoDB
            const user = await User.findOne({ email: req.body.email });
            if (!user) return res.status(400).send({ message: "The e-mail hasn't been found" });

            // 2. Check if the provided credentials match encrypted database vectors
            const validPass = await bcrypt.compare(req.body.password, user.password);
            if (!validPass) return res.status(400).send({ message: "Invalid password!" });

            // 3. Generate secure state authentication token mapped to institutional secrets
            const token = jwt.sign(
                { _id: user._id, role: user.role }, 
                process.env.SECRET_TOKEN, 
                { expiresIn: '24h' }
            );

            // 4. Synchronizing all data, including badges and courses
            return res.header('auth-token', token).status(200).send({
                message: 'Successfully logged in!',
                token: token,
                user: {
                    id: user._id,
                    _id: user._id, 
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    badges: user.badges || [], 
                    enrolledCourses: user.enrolledCourses || [], 
                    completedCourses: user.completedCourses || [], 
                    badgeLevel: user.badgeLevel || 'None'
                }
            });
        } catch (err) {
            return res.status(500).send({ message: "Database connection error. Server environment failure." });
        }
    });

    // PROTECTED TEST ROUTE (Requires active token evaluation verification)
    router.get('/test-user-data', verify, (req, res) => {
        res.send({
            message: 'Access granted! You are authorized to see this.',
            authorizedUser: {
                id: req.user._id,
                role: req.user.role
            }
        });
    });

    const crypto = require('crypto');
    const nodemailer = require('nodemailer');

    // =========================================================================
    // 1. FORGOT PASSWORD ROUTE (Generates token and dispatches email)
    // =========================================================================
    router.post('/forgot-password', async (req, res) => {
        try {
            // Search for user identity within the database registry
            const user = await User.findOne({ email: req.body.email.toLowerCase() });

            // Prevent user enumeration by returning a generic success message if user is not found
            if (!user) {
                return res.status(200).send({ 
                    message: 'If that email exists in our system, a secured reset link has been deployed.' 
                });
            }

            // Generate a cryptographically secure random hexadecimal token
            const token = crypto.randomBytes(20).toString('hex');

            // Assign token parameters and expiration window (15 minutes lifespan)
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; 

            await user.save(); 

            // Configure dynamic SMTP transporter utilizing environment variables
            const transporter = nodemailer.createTransport({
                host: process.env.MAILTRAP_HOST,
                port: parseInt(process.env.MAILTRAP_PORT) || 2525,
                auth: {
                    user: process.env.MAILTRAP_USER,
                    pass: process.env.MAILTRAP_PASS 
                }
            });

            // Establish absolute client domain URL dynamically for staging/production targets
            const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
            const resetUrl = `${clientUrl}/reset-password/${token}`;

            // Structured transactional mail options using standard HTML formatting
            const mailOptions = {
                from: '"LearningHub Security" <security@learninghub.com>',
                to: user.email,
                subject: 'LearningHub - Account access reset request',
                html: `
                    <div style="font-family: monospace; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #0d0d0d; border-bottom: 2px solid #a3e635; padding-bottom: 10px;">Access reset matrix requested</h2>
                        <p>Hello, <strong>${user.firstName}</strong>,</p>
                        <p>A request was triggered to override your institutional password signature. This authorization vector is active for exactly 15 minutes.</p>
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="${resetUrl}" style="background-color: #a3e635; color: #000; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 14px;">RESET PASSWORD</a>
                        </div>
                        <p style="font-size: 11px; color: #64748b;">If you did not issue this verification sequence, you can safely ignore this network packet. Your current password signature remains safely encrypted.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);

            return res.status(200).send({ 
                message: 'If that email exists in our system, a secured reset link has been deployed.' 
            });

        } catch (err) {
            return res.status(500).send({ message: 'Internal mailer or database failure. Verification aborted.' });
        }
    });

    // =========================================================================
    // 2. RESET PASSWORD ROUTE (Validates token parameter and updates password)
    // =========================================================================
    router.post('/reset-password/:token', async (req, res) => {
        try {
            // Safe extraction fallback handling both path variables and query schemas
            const tokenParam = req.params.token || req.query.token;

            // Query active token reference that satisfies the expiration lifespan constraint
            const user = await User.findOne({
                resetPasswordToken: tokenParam,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).send({ message: 'Password reset token is invalid or has expired.' });
            }

            // Apply raw password; schema middleware lifecycle handles encryption before final write
            user.password = req.body.password;

            // Nullify validation criteria tokens upon successful operation completion
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;

            await user.save();

            return res.status(200).send({ message: 'Your password signature has been successfully updated!' });

        } catch (err) {
            return res.status(500).send({ message: 'Database transaction error. Password modification failed.' });
        }
    });

module.exports = router;