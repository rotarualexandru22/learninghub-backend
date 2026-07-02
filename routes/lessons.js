const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const verify = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');

    // ADD A LESSON TO A COURSE (Administrative access required)
    // URL: POST -> /api/lessons/add
    router.post('/add', [verify, verifyAdmin], async (req, res) => {        
        const lesson = new Lesson({
            courseId: req.body.courseId, 
            title: req.body.title,
            description: req.body.description,
            videoUrl: req.body.videoUrl,
            duration: req.body.duration,
            order: req.body.order
        });
    
        try {
            const savedLesson = await lesson.save();
            return res.status(201).send({
                message: 'Lesson added successfully!',
                lesson: savedLesson
            });
        } catch (err) {
            console.error('Failed to create lesson document:', err.message);
            return res.status(400).send({ message: 'Validation failed. Unable to register lesson node.' });
        }
    });
    
    // GET LESSONS FOR A SPECIFIC COURSE
    // URL: GET -> /api/lessons/:courseId
    router.get('/:courseId', verify, async (req, res) => {
        try {
            // Retrieve associated curriculum records indexed and sorted by priority order
            const lessons = await Lesson.find({ courseId: req.params.courseId }).sort('order');
            return res.send(lessons);
        } catch (err) {
            console.error('Query execution failed on lesson fetch:', err.message);
            return res.status(400).send({ message: 'Invalid entity reference or sequence lookup parameters failed.' });
        }
    });

module.exports = router;