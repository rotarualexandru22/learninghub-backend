const Joi = require('joi');

const registerValidation = (data) => {
    const schema = Joi.object({
        firstName: Joi.string().min(2).required(),
        lastName: Joi.string().min(2).required(),
        username: Joi.string().min(3).required(), 
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string()
    });
    return schema.validate(data);
};

// Course Validation
const courseValidation = (data) => {
    const schema = Joi.object({
        title: Joi.string().min(5).max(100).required(),
        description: Joi.string().min(20).required(),
        thumbnail: Joi.string().uri(), // Verifică dacă e un link valid
        instructor: Joi.string().required(),
        category: Joi.string().required(),
        level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced') // Doar astea 3 sunt permise
    });
    return schema.validate(data);
};

// Lesson Validation
const lessonValidation = (data) => {
    const schema = Joi.object({
        courseId: Joi.string().required(),
        title: Joi.string().min(5).required(),
        description: Joi.string(),
        videoUrl: Joi.string().uri().required(),
        duration: Joi.string().required(),
        order: Joi.number().integer().min(1).required()
    });
    return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.courseValidation = courseValidation;
module.exports.lessonValidation = lessonValidation;
