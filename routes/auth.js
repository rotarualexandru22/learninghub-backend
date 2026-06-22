const jwt = require("jsonwebtoken");
const verify = require("../middleware/verifyToken");
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { registerValidation } = require('../middleware/validation');
const bcrypt = require("bcryptjs");

// =========================================================================
// REAL DATABASE REGISTER ROUTE
// =========================================================================
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

// =========================================================================
// REAL DATABASE LOGIN ROUTE
// =========================================================================
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
        
        // 4. Synchronize all metadata entities cleanly down to the React frontend state context
        return res.header('auth-token', token).status(200).send({
            message: 'Successfully logged in!',
            token: token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (err) {
        return res.status(500).send({ message: "Database connection error. Server environment failure." });
    }
});

// =========================================================================
// PROTECTED TEST ROUTE (Requires active token evaluation verification)
// =========================================================================
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
// 1. FORGOT PASSWORD ROUTE (Generează token-ul și trimite emailul)
// =========================================================================
router.post('/forgot-password', async (req, res) => {
    try {
        // Căutăm dacă emailul introdus chiar există în baza de date
        const user = await User.findOne({ email: req.body.email.toLowerCase() });
        
        // Regulă de securitate premium: nu confirmăm hackerilor dacă un email e valid sau nu.
        // În schimb, trimitem un mesaj de succes fals pentru a preveni maparea conturilor.
        if (!user) {
            return res.status(200).send({ 
                message: 'If that email exists in our system, a secured reset link has been deployed.' 
            });
        }

        // Generăm un token unic format din 20 de caractere hexazecimale la nivel criptografic
        const token = crypto.randomBytes(20).toString('hex');

        // Setezi token-ul și expirarea (15 minute de la momentul curent) direct pe obiectul user
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minute în milisecunde

        await user.save(); // Salvezi datele în MongoDB Atlas

        // CONFIGURAREA TRANSPORTER-ULUI NODEMAILER (Pune aici datele tale din Mailtrap!)
        const transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "e97d285ccd71d8",
                pass: "910d9495b2b1e3"
            }
        });

        // Construiești URL-ul securizat care va duce spre frontend
        const resetUrl = `http://localhost:5173/reset-password?token=${token}`;

        // Structura vizuală a emailului (HTML curat)
        const mailOptions = {
            from: '"LearningHub Security" <security@learninghub.com>',
            to: user.email,
            subject: '🔒 LearningHub - Account access reset request',
            html: `
                <div style="font-family: monospace; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
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

        // Trimitem emailul efectiv
        await transporter.sendMail(mailOptions);

        return res.status(200).send({ 
            message: 'If that email exists in our system, a secured reset link has been deployed.' 
        });

    } catch (err) {
        return res.status(500).send({ message: 'Internal mailer or database failure. Verification aborted.' });
    }
});

// =========================================================================
// 2. RESET PASSWORD ROUTE (Verifică token-ul și actualizează parola)
// =========================================================================
router.post('/reset-password/:token', async (req, res) => {
    try {
        // Căutăm userul care are exact token-ul din link ȘI la care timpul de expirare este MAI MARE decât acum ($gt = greater than)
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).send({ message: 'Password reset token is invalid or has expired.' });
        }

        // Atribui noua parolă primită din frontend. 
        // ATENȚIE: Datorită middleware-ului pre("save") din User.js, Mongoose o va cripta AUTOMAT înainte de salvare!
        user.password = req.body.password;
        
        // Curățăm vectorii de resetare din baza de date, deoarece procesul s-a încheiat cu succes
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        return res.status(200).send({ message: 'Your password signature has been successfully updated!' });

    } catch (err) {
        return res.status(500).send({ message: 'Database transaction error. Password modification failed.' });
    }
});

module.exports = router;