const jwt = require('jsonwebtoken');
const { User, Project } = require('../models');

const setupSockets = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error: No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('Authentication error: Invalid user'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Token failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.id})`);

    // Join a project room for real-time updates
    socket.on('join-project', async (projectId) => {
      try {
        // Optional: Verify if user is part of the project
        const project = await Project.findById(projectId);
        if (!project) return;
        
        const isOwner = project.owner.toString() === socket.user._id.toString();
        const isMember = project.members.some(m => m.user.toString() === socket.user._id.toString());

        if (isOwner || isMember) {
          const roomName = `project_${projectId}`;
          socket.join(roomName);
          console.log(`${socket.user.name} joined room: ${roomName}`);
        }
      } catch (error) {
        console.error('Socket join-project error:', error);
      }
    });

    socket.on('leave-project', (projectId) => {
      const roomName = `project_${projectId}`;
      socket.leave(roomName);
      console.log(`${socket.user.name} left room: ${roomName}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = setupSockets;
