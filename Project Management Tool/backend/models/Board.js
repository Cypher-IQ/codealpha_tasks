const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Board = sequelize.define('Board', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    }
  },
  columns: {
    type: DataTypes.JSON, // Stores array of { _id: string, name: string, order: number }
    defaultValue: [],
  }
}, {
  timestamps: true,
});

module.exports = Board;
