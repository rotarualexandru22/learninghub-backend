const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const verify = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');

// ADD A LESSON TO A COURSE (Admin only)
router.post('/add', [verify, verifyAdmin], async (req, res) => {
    const lesson = new Lesson({
        courseId: req.body.courseId, // You get this from the created course ID
        title: req.body.title,
        description: req.body.description,
        videoUrl: req.body.videoUrl,
        duration: req.body.duration,
        order: req.body.order
    });

    try {
        const savedLesson = await lesson.save();
        res.status(201).send({
            message: 'Lesson added successfully!',
            lesson: savedLesson
        });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET LESSONS FOR A SPECIFIC COURSE
router.get('/:courseId', verify, async (req, res) => {
    try {
        const lessons = await Lesson.find({ courseId: req.params.courseId }).sort('order');
        res.send(lessons);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;