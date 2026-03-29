const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize Sequelize to use SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false, // Set to console.log to see SQL queries
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite Database Connected.');
    // In production, you'd use migrations. For this, sync is okay.
    // We will call sync() after defining all models in models/index.js
  } catch (error) {
    console.error('Error connecting to SQLite:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
