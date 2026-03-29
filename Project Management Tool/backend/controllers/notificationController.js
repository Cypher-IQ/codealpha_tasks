const { Notification } = require('../models');

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const formatted = notifications.map(n => {
        const j = n.toJSON();
        j._id = j.id;
        return j;
    });

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.read = true;
    await notification.save();

    const j = notification.toJSON();
    j._id = j.id;
    res.status(200).json(j);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead
};
