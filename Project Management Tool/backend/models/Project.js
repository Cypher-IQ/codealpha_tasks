const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    }
  },
  description: {
    type: DataTypes.TEXT,
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  members: {
    type: DataTypes.JSON, // Stores array of { user: userId, role: 'admin'|'member' }
    defaultValue: [],
  }
}, {
  timestamps: true,
});

module.exports = Project;
