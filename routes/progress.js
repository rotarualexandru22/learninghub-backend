const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const User = require('../models/User');
const verify = require('../middleware/verifyToken');

    /**
     * UPDATE PROGRESS & ANTI-SKIP LOGIC
     * Triggered by the frontend player to save position and track total watch time.
     */
    router.post('/update', verify, async (req, res) => {
        const { courseId, lessonId, currentTime, duration, increment } = req.body;
    
        try {
            // 1. Find or initialize the progress record
            let progress = await Progress.findOne({ userId: req.user._id, lessonId });
        
            if (!progress) {
                progress = new Progress({
                    userId: req.user._id,
                    courseId,
                    lessonId
                });
            }
        
            // 2. Update Memory Player position
            progress.lastPlayedTime = currentTime;
        
            // 3. Increment total time spent watching (Anti-Skip)
            // We only accumulate time if the lesson isn't already finished
            if (!progress.completed) {
                progress.totalWatchedSeconds += increment;
            }
        
            // 4. Secure Auto-Complete Logic
            // Threshold: 90% of the video duration must be actually watched
            const secureThreshold = duration * 0.9;
            let badgeEarned = null;
        
            if (!progress.completed && progress.totalWatchedSeconds >= secureThreshold) {
                progress.completed = true;
            
                // 5. Update User Badges
                const user = await User.findById(req.user._id);
                if (user) {
                    user.completedCourses += 1;
                
                    // Set Badge levels based on total completed lessons
                    if (user.completedCourses >= 1 && user.completedCourses < 5) {
                        user.badgeLevel = 'Beginner';
                    } else if (user.completedCourses >= 5 && user.completedCourses < 10) {
                        user.badgeLevel = 'Intermediate';
                    } else if (user.completedCourses >= 10) {
                        user.badgeLevel = 'Expert';
                    }
                
                    await user.save();
                    badgeEarned = user.badgeLevel;
                }
            }
        
            await progress.save();
        
            // 6. Respond with updated stats
            res.status(200).send({
                message: progress.completed ? 'Lesson completed!' : 'Progress updated',
                completed: progress.completed,
                totalWatched: progress.totalWatchedSeconds,
                lastPlayedTime: progress.lastPlayedTime,
                currentBadge: badgeEarned || 'No changes'
            });
        
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });
    
    // GET USER PROGRESS FOR A SPECIFIC COURSE
    // This tells the frontend which lessons should have a "completed" checkmark
    router.get('/:courseId', verify, async (req, res) => {
        try {
            const progress = await Progress.find({
                userId: req.user._id,
                courseId: req.params.courseId
            });
            
            res.send(progress);
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });

module.exports = router;