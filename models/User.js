const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  username: { type: String, required: true, unique: true, minlength: 3 },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  
  // SYSTEM INTEGRATION: Badges array used in the interface
  badges: { type: [String], default: [] },
  
  // SYSTEM INTEGRATION: Courses that the student enrolled to
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  
  badgeLevel: { type: String, enum: ['None', 'Beginner', 'Intermediate', 'Advanced'], default: 'None' },
  completedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }], // Schimbat în array pentru precizie
  avatar: { type: String, default: null },
  
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });

// Hash (Middleware)
userSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

module.exports = mongoose.model('User', userSchema);