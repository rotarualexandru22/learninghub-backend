const mongoose = require('mongoose');

/**
 * Progress Model
 * Tracks user interaction with specific lessons, including:
 * - lastPlayedTime: for the Memory Player (resume from where you left off)
 * - totalWatchedSeconds: anti-skip logic (actual time spent watching)
 * - completed: final status of the lesson
 */
const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    lastPlayedTime: {
        type: Number,
        default: 0
    },
    totalWatchedSeconds: {
        type: Number,
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Ensure a user has only one progress record per lesson
progressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);