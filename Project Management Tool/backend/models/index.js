const { sequelize } = require('../config/db');

// Import all models
const User = require('./User');
const Project = require('./Project');
const Board = require('./Board');
const Task = require('./Task');
const Comment = require('./Comment');
const ActivityLog = require('./ActivityLog');
const Notification = require('./Notification');

// Define relationships
User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Project.hasMany(Board, { foreignKey: 'projectId', as: 'boards' });
Board.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Board.hasMany(Task, { foreignKey: 'boardId', as: 'tasks' });
Task.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });

Project.hasMany(Task, { foreignKey: 'projectId', as: 'projectTasks' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments' });
Comment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Project.hasMany(ActivityLog, { foreignKey: 'projectId', as: 'activityLogs' });
ActivityLog.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Export everything along with sequelize instance
module.exports = {
  sequelize,
  User,
  Project,
  Board,
  Task,
  Comment,
  ActivityLog,
  Notification
};
