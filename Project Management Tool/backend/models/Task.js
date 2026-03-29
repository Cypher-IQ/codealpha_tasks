const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  boardId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  columnId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    }
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  assignees: {
    type: DataTypes.JSON, // Array of User IDs
    defaultValue: [],
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'Medium',
  },
  dueDate: {
    type: DataTypes.DATE,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  labels: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  subtasks: {
    type: DataTypes.JSON,
    defaultValue: [],
  }
}, {
  timestamps: true,
});

module.exports = Task;
