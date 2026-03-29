const { body } = require('express-validator');

const userRegisterSchema = [
  body('name', 'Name is required').notEmpty().trim(),
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
];

const userLoginSchema = [
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password is required').exists(),
];

const projectSchema = [
  body('name', 'Project name is required').notEmpty().trim(),
  body('description', 'Description format is invalid').optional().isString(),
];

const boardSchema = [
  body('name', 'Board name is required').notEmpty().trim(),
];

const taskSchema = [
  body('title', 'Task title is required').notEmpty().trim(),
  body('columnId', 'Column ID is required').notEmpty(),
];

// Reusable schemas could be added here

module.exports = {
  userRegisterSchema,
  userLoginSchema,
  projectSchema,
  boardSchema,
  taskSchema
};
