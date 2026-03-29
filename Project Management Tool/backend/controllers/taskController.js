const { Task, User, ActivityLog } = require('../models');
const { Op } = require('sequelize');

const emitToProject = (req, eventName, data) => {
  const io = req.app.get('io');
  if (io) io.to(`project_${data.projectId}`).emit(eventName, data);
};

const logActivity = async (projectId, userId, action, target) => {
  await ActivityLog.create({ projectId, userId, action, target });
};

// @desc    Create a task
// @route   POST /api/projects/:projectId/boards/:boardId/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, columnId, priority, dueDate, assignees, labels } = req.body;
    const body = {
      projectId: req.params.projectId,
      boardId: req.params.boardId,
      title,
      columnId,
    };
    if (description) body.description = description;
    if (priority) body.priority = priority;
    if (dueDate) body.dueDate = dueDate;
    if (assignees) body.assignees = assignees;
    if (labels) body.labels = labels;

    const count = await Task.count({ where: { boardId: req.params.boardId, columnId } });
    body.order = count;

    const task = await Task.create(body);
    
    await logActivity(req.params.projectId, req.user.id, 'CREATED_TASK', { taskId: task.id, taskName: task.title });
    
    const textTask = task.toJSON();
    textTask._id = textTask.id;
    textTask.assignees = []; 
    
    emitToProject(req, 'task-created', textTask);

    res.status(201).json(textTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks for a board (with filters & pagination)
// @route   GET /api/projects/:projectId/boards/:boardId/tasks
const getTasks = async (req, res, next) => {
  try {
    const { priority, assignee, labels, search, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    const where = { boardId: req.params.boardId };

    if (priority) where.priority = priority;
    if (search) where.title = { [Op.like]: `%${search}%` };
    if (assignee) {
      // JSON array substring match for SQLite fallback
      where.assignees = { [Op.like]: `%${assignee}%` };
    }
    if (labels) {
       where.labels = { [Op.like]: `%${labels}%` };
    }

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      order: [['order', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const allAssigneeIds = new Set();
    tasks.forEach(t => {
      (t.assignees || []).forEach(id => allAssigneeIds.add(id));
    });

    const users = await User.findAll({
      where: { id: Array.from(allAssigneeIds) },
      attributes: ['id', 'name', 'email', 'avatar']
    });

    const userMap = {};
    users.forEach(u => userMap[u.id] = { _id: u.id, name: u.name, email: u.email, avatar: u.avatar });

    const formatted = tasks.map(t => {
      const j = t.toJSON();
      j._id = j.id;
      j.assignees = (j.assignees || []).map(id => userMap[id]).filter(Boolean);
      j.board = j.boardId;
      j.project = j.projectId;
      return j;
    });

    res.status(200).json({
       data: formatted,
       total: count,
       page: parseInt(page),
       totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/projects/:projectId/tasks/:taskId
const updateTask = async (req, res, next) => {
  try {
    const { title, description, columnId, order, priority, dueDate, assignees, labels, subtasks, attachments } = req.body;
    let task = await Task.findByPk(req.params.taskId);

    if (!task) return res.status(404).json({ message: 'Task not found' });

    let canEdit = false;
    if (req.projectRole === 'owner' || req.projectRole === 'admin') canEdit = true;
    else if ((task.assignees || []).includes(req.user.id)) canEdit = true;
    
    if (!canEdit) {
      return res.status(403).json({ message: 'Only assigned users, admins, or owners can edit this task' });
    }

    const oldColumnId = task.columnId;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignees) task.assignees = assignees;
    if (labels) task.labels = labels;
    if (subtasks) task.subtasks = subtasks;
    if (attachments) task.attachments = attachments;
    if (columnId !== undefined) task.columnId = columnId;
    if (order !== undefined) task.order = order;

    await task.save();

    const j = task.toJSON();
    j._id = j.id;
    j.board = j.boardId;
    j.project = j.projectId;

    const populatedUsers = await User.findAll({
      where: { id: j.assignees || [] },
      attributes: ['id', 'name', 'email', 'avatar']
    });
    j.assignees = populatedUsers.map(u => ({ _id: u.id, name: u.name, email: u.email, avatar: u.avatar }));

    if (oldColumnId !== String(columnId)) {
        await logActivity(task.projectId, req.user.id, 'MOVED_TASK', { taskId: task.id, taskName: task.title, from: oldColumnId, to: columnId });
        emitToProject(req, 'task-moved', j);
    } else {
        emitToProject(req, 'task-updated', j);
    }

    res.status(200).json(j);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
};
