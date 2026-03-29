# Advanced Project Management Tool Backend

This is the backend for a full-stack, real-time Project Management Tool similar to Trello or Asana, built with Node.js, Express, MongoDB, and Socket.io.

## Real-world Features Implemented
- **Role-Based Access Control (RBAC):** Proper checking for Owner, Admin, and Member permissions.
- **Dynamic Board Columns:** Custom columns per board allowing for full flexibility.
- **Advanced Task Features:** Subtasks, attachments, custom labels, assignees, and order handling.
- **Real-Time Updates:** Socket.io emits events for `task-created`, `task-moved`, `task-updated`, `comment-added`, etc. to all users connected to the same `project_{id}` room.
- **Activity Logging & Notifications:** Automatic activity generation and lightweight notification system for project events.
- **Security & Validation:** Helmet for headers, `express-rate-limit` for DDoS/brute forcing protection on Auth routes, strict `express-validator` payload checking.

## Folder Structure
- `config/` - Database and configuration files
- `controllers/` - Route logic and handlers.
- `middleware/` - Custom Express middlewares (Auth, Roles, Errors).
- `models/` - Mongoose database schemas.
- `routes/` - Express routers mapping path endpoints to controllers.
- `sockets/` - Socket.io connection and event handling.
- `validations/` - Validation schemas for payload checks.

## Setup Instructions

1. Ensure **MongoDB** is running locally or you have a cloud connection string.
2. In the `backend` folder, install dependencies:
   ```bash
   npm install
   ```
3. Ensure `.env` is configured correctly (using the contents of `.env.example`).
4. Start the application:
   ```bash
   npm run dev
   ```
   *The server will start on port 5000 (or the port defined in .env) using `nodemon`.*
