const Joi = require('joi');

/**
 * Validate user data payloads during the registration process.
 */
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

/**
 * Validate data payloads during course node creation.
 */
const courseValidation = (data) => {
    const schema = Joi.object({
        title: Joi.string().min(5).max(100).required(),
        description: Joi.string().min(20).required(),
        thumbnail: Joi.string().uri(), 
        instructor: Joi.string().required(),
        category: Joi.string().required(),
        level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced') 
    });
    return schema.validate(data);
};

/**
 * Validate structural lesson nodes attached to a course ledger.
 */
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