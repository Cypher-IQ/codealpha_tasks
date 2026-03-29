const express = require('express');
const router = express.Router({ mergeParams: true });
const { createTask, getTasks, updateTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectRole } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { taskSchema } = require('../validations/schemas');

router.route('/')
  .post(protect, checkProjectRole(['owner', 'admin', 'member']), taskSchema, validate, createTask)
  .get(protect, checkProjectRole(['owner', 'admin', 'member']), getTasks);

router.route('/:taskId')
  .put(protect, checkProjectRole(['owner', 'admin', 'member']), updateTask);

module.exports = router;
