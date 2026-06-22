const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  lastName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true, 
    minlength: 6 
  },
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    minlength: 3 
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  // Badge system
  badgeLevel: { 
    type: String, 
    enum: ['None', 'Beginner', 'Intermediate', 'Advanced'], 
    default: 'None' 
  },
  completedCourses: { 
    type: Number, 
    default: 0 
  },
  avatar: {
    type: String,
    default: null
  },
  
  // =========================================================================
  // SECURE RESET PASSWORD VECTORS (ADĂUGATE ACUM)
  // =========================================================================
  resetPasswordToken: { 
    type: String, 
    default: null 
  },
  resetPasswordExpires: { 
    type: Date, 
    default: null 
  }
}, { timestamps: true });

// Hash logic (Middleware)
userSchema.pre("save", async function() {
  // If the password hasn't been modified, we continue
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err; // The error is thrown to Mongoose
  }
});

module.exports = mongoose.model('User', userSchema);