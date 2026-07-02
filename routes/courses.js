const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User'); 
const verify = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');

    // CREATE A NEW COURSE (Admin only)
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

    // DELETE A COURSE (Admin only)
    router.delete('/:id', [verify, verifyAdmin], async (req, res) => {
        try {
            await Course.findByIdAndDelete(req.params.id);
            res.send({ message: 'Course deleted successfully' });
        } catch (err) { 
            res.status(400).send({ message: err.message }); 
        }
    });

    // ENROLL IN COURSE ENDPOINT
    // URL: POST -> /api/courses/:id/enroll
    router.post('/:id/enroll', verify, async (req, res) => {
        try {
            const courseId = req.params.id;
            const userId = req.user._id; 

            // 1. Verify if the academic course entity exists in the database
            const course = await Course.findById(courseId);
            if (!course) return res.status(404).send({ message: 'Target academic course node not found.' });

            // 2. Retrieve user profile context from database
            const user = await User.findById(userId);
            if (!user) return res.status(404).send({ message: 'User identity not found.' });

            // 3. Prevent duplicate enrollment records for the same course node
            if (user.enrolledCourses.includes(courseId)) {
                return res.status(400).send({ message: 'User is already linked to this course node.' });
            }

            // 4. Append the course reference to the active enrollment array
            user.enrolledCourses.push(courseId);
            await user.save();

            // Sanitize user object by stripping sensitive credential parameters before transmission
            const updatedUser = user.toObject();
            delete updatedUser.password;

            return res.status(200).send({
                message: 'Successfully enrolled in course!',
                user: updatedUser 
            });

        } catch (err) {
            // Log the detailed database error internally for server-side maintenance
            console.error('Enrollment transaction failure:', err.message);
            
            // Return a generic error structure to secure system implementation details
            return res.status(500).send({ message: 'Internal database transaction error. Operation aborted.' });
        }
    });

module.exports = router;