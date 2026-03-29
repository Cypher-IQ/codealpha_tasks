const { ActivityLog, User } = require('../models');

// @desc    Get activity logs for a project
// @route   GET /api/projects/:projectId/activities
// @access  Private
const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.findAll({
      where: { projectId: req.params.projectId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    const formatted = logs.map(l => {
        const j = l.toJSON();
        j._id = j.id;
        return j;
    });

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs
};
