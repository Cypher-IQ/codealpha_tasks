const { Project, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      ownerId: req.user.id,
      members: [{ user: req.user.id, role: 'admin' }]
    });

    const projectJSON = project.toJSON();
    projectJSON._id = project.id; // compat

    res.status(201).json(projectJSON);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects for a user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const allProjects = await Project.findAll({
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] }
      ]
    });

    const userProjects = allProjects.filter(p => {
      if (p.ownerId === req.user.id) return true;
      const members = p.members || [];
      return members.some(m => m.user === req.user.id);
    });

    // Sub-slice for pagination
    const paginatedProjects = userProjects.slice(offset, offset + parseInt(limit));

    // Format for frontend compat
    const formatted = paginatedProjects.map(p => {
      const j = p.toJSON();
      j._id = j.id;
      return j;
    });

    res.status(200).json({
       data: formatted,
       total: userProjects.length,
       page: parseInt(page),
       totalPages: Math.ceil(userProjects.length / limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:projectId
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.projectId, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    });
    
    if(!project) return res.status(404).json({message: 'Not found'});

    const j = project.toJSON();
    j._id = j.id;
    res.status(200).json(j);
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:projectId
// @access  Private (Owner/Admin only)
const updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const project = req.project; // From middleware
    
    if (name) project.name = name;
    if (description !== undefined) project.description = description;

    await project.save();
    
    const j = project.toJSON();
    j._id = j.id;
    res.status(200).json(j);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:projectId
// @access  Private (Owner only)
const deleteProject = async (req, res, next) => {
  try {
    await req.project.destroy();
    res.status(200).json({ message: 'Project removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:projectId/members
// @access  Private (Owner/Admin only)
const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const project = req.project;
    const members = project.members || [];

    const isMember = members.find(m => m.user === user.id);
    if (isMember) return res.status(400).json({ message: 'User is already a member' });

    project.members = [...members, { user: user.id, role: role || 'member' }];
    await project.save();

    const io = req.app.get('io');
    if (io) {
        io.to(`project_${project.id}`).emit('user-added-to-project', { project: project.id, user: { id: user.id, name: user.name, email: user.email }});
    }

    res.status(200).json(project.members);
  } catch (error) {
    next(error);
  }
};

// @desc    Invite member via email
// @route   POST /api/projects/:projectId/invite
// @access  Private (Owner/Admin only)
const inviteUser = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not registered' });

    const project = req.project;
    const members = project.members || [];

    const isMember = members.find(m => m.user === user.id);
    if (isMember) return res.status(400).json({ message: 'User is already a member' });

    project.members = [...members, { user: user.id, role: 'member' }];
    await project.save();

    // Create Notification
    const { Notification } = require('../models');
    await Notification.create({
      userId: user.id,
      message: `You were added to Project "${project.name}"`,
      link: `/` 
    });

    const io = req.app.get('io');
    if (io) {
        io.to(`project_${project.id}`).emit('user-joined', { user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }});
        io.to(`project_${project.id}`).emit('user-added', { user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }});
    }

    res.status(200).json({ message: 'User invited successfully', members: project.members });
  } catch (error) {
    next(error);
  }
};

// @desc    Join project via invite link
// @route   POST /api/projects/:projectId/join
// @access  Private
const joinProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findByPk(projectId);
    
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const members = project.members || [];
    const isMember = members.find(m => m.user === req.user.id);
    
    if (isMember) {
       return res.status(200).json({ message: 'Already a member',  project: project.id });
    }

    project.members = [...members, { user: req.user.id, role: 'member' }];
    await project.save();

    const io = req.app.get('io');
    if (io) {
        io.to(`project_${project.id}`).emit('user-joined', { user: { id: req.user.id, name: req.user.name, email: req.user.email, avatar: req.user.avatar }});
        io.to(`project_${project.id}`).emit('user-added', { user: { id: req.user.id, name: req.user.name, email: req.user.email, avatar: req.user.avatar }});
    }

    res.status(200).json({ message: 'Joined project successfully', project: project.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  inviteUser,
  joinProject
};
