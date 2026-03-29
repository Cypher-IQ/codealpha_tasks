const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { initDb } = require('./database');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS configuration for Socket.io and Express
const corsOptions = {
    origin: '*', // For development, allow all origins
    methods: ['GET', 'POST']
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, {
    cors: corsOptions
});

// Import socket signaling logic
const setupSignaling = require('./socket/signaling');
setupSignaling(io);

// Import REST routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const uploadRoutes = require('./routes/upload');

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/upload', uploadRoutes);

// Initialize DB and start server
const PORT = process.env.PORT || 5000;

initDb().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
});
