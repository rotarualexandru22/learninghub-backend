const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course', // Reference to the Course model
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    videoUrl: {
        type: String, // Link to YouTube, Vimeo, or Cloudinary
        required: true
    },
    duration: {
        type: String, // e.g., "10:30"
        required: true
    },
    order: {
        type: Number, // To keep lessons in the correct sequence (1, 2, 3...)
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);