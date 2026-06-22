const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const verify = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');

// CREATE A NEW COURSE (Admin only)
// Protected by: verify (is logged in) and verifyAdmin (is admin)
router.post('/add', [verify, verifyAdmin], async (req, res) => {
    const course = new Course({
        title: req.body.title,
        description: req.body.description,
        thumbnail: req.body.thumbnail,
        instructor: req.body.instructor,
        category: req.body.category,
        level: req.body.level
    });

    try {
        const savedCourse = await course.save();
        res.status(201).send({
            message: 'Course created successfully!',
            course: savedCourse
        });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET ALL COURSES (Public or logged in users)
router.get('/all', async (req, res) => {
    try {
        const courses = await Course.find();
        res.send(courses);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET A SPECIFIC COURSE BY ID
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).send({ message: 'Course not found.' });
        res.send(course);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;