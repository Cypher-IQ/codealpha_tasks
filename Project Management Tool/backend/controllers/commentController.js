const { Comment, Task, User, ActivityLog, Notification } = require('../models');

const emitToProject = (req, eventName, data) => {
  const io = req.app.get('io');
  if (io) io.to(`project_${data.projectId}`).emit(eventName, data);
};

// @desc    Add a comment to a task
// @route   POST /api/projects/:projectId/tasks/:taskId/comments
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    
    const task = await Task.findByPk(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const comment = await Comment.create({
      taskId: req.params.taskId,
      userId: req.user.id,
      text
    });

    const populatedComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }]
    });

    const j = populatedComment.toJSON();
    j._id = j.id;

    emitToProject(req, 'comment-added', { projectId: req.params.projectId, comment: j });
    
    await ActivityLog.create({
      projectId: req.params.projectId,
      userId: req.user.id,
      action: 'ADDED_COMMENT',
      target: { taskId: task.id, taskName: task.title }
    });

    for (const assigneeId of (task.assignees || [])) {
      if (assigneeId !== req.user.id) {
        await Notification.create({
          userId: assigneeId,
          message: `${req.user.name} commented on "${task.title}": "${text.substring(0, 30)}..."`,
          link: `/project/${req.params.projectId}/board/${task.boardId}/task/${task.id}`
        });
      }
    }

    res.status(201).json(j);
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a task
// @route   GET /api/projects/:projectId/tasks/:taskId/comments
// @access  Private
const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.findAll({
      where: { taskId: req.params.taskId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }],
      order: [['createdAt', 'DESC']]
    });
    
    const formatted = comments.map(c => {
      const j = c.toJSON();
      j._id = j.id;
      return j;
    });

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addComment,
  getComments
};
