const { Project, Task } = require('../models');

// Check if user is owner, admin, or member of the project
const checkProjectRole = (rolesAllowed = ['owner', 'admin', 'member']) => {
  return async (req, res, next) => {
    try {
      let projectId = req.params.projectId || req.body.projectId || req.body.project;
      
      if (!projectId && req.params.taskId) {
          const task = await Task.findByPk(req.params.taskId);
          if(!task) return res.status(404).json({ message: 'Task not found' });
          projectId = task.projectId;
      }

      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }

      const project = await Project.findByPk(projectId);

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Check if user is owner
      let userRole = null;
      if (project.ownerId === req.user.id) {
        userRole = 'owner';
      } else {
        // members is an array of objects stored as JSON
        const members = project.members || [];
        const member = members.find((m) => m.user === req.user.id);
        if (member) {
          userRole = member.role; // 'admin' or 'member'
        }
      }

      if (!userRole) {
        return res.status(403).json({ message: 'Not authorized to access this project' });
      }

      if (!rolesAllowed.includes(userRole)) {
        return res.status(403).json({ message: `Role ${userRole} is not authorized for this action` });
      }

      req.projectRole = userRole;
      req.project = project; // Pass to next middleware/controller
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error verifying role' });
    }
  };
};

module.exports = { checkProjectRole };
