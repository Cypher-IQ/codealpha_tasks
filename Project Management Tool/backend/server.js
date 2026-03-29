require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');

const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const routes = require('./routes');
const setupSockets = require('./sockets/socketHandler');

// Models Index handles associations
const db = require('./models');

const app = express();
const server = http.createServer(app);

// Connect Database & Sync Models
connectDB().then(() => {
  db.sequelize.sync().then(() => {
    console.log('Database synced');
  });
});

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*', // Should be restricted in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }
});
app.set('io', io); // Make io accessible via req.app.get('io')
setupSockets(io);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
}));
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api', routes);

// Base route test
app.get('/', (req, res) => {
  res.send('Project Management API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
