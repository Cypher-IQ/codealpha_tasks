const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const boardRoutes = require('./boardRoutes');
const taskRoutes = require('./taskRoutes');
const commentRoutes = require('./commentRoutes');

const { protect } = require('../middleware/authMiddleware');
const { checkProjectRole } = require('../middleware/roleMiddleware');

const { getActivityLogs } = require('../controllers/activityLogController');
const { getNotifications, markAsRead } = require('../controllers/notificationController');

// Global API routes mapping
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);

// For project nested routes (boards, activities)
router.use('/projects/:projectId/boards', boardRoutes);
router.use('/projects/:projectId/boards/:boardId/tasks', taskRoutes);
router.use('/projects/:projectId/tasks/:taskId/comments', commentRoutes);

// Project Activities
router.get('/projects/:projectId/activities', protect, checkProjectRole(['owner', 'admin', 'member']), getActivityLogs);

// Task separate route (if editing a task without needing board context in URL, although we use project context for RBAC mostly)
// E.g. /api/projects/:projectId/tasks/:taskId for update/delete
router.use('/projects/:projectId/tasks', taskRoutes);

// Notifications
const notifRouter = express.Router();
notifRouter.get('/', protect, getNotifications);
notifRouter.put('/:id/read', protect, markAsRead);
router.use('/notifications', notifRouter);

module.exports = router;
