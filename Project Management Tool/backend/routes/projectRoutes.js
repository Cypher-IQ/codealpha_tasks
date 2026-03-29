const express = require('express');
const router = express.Router();
const { 
  createProject, 
  getProjects, 
  getProjectById, 
  updateProject, 
  deleteProject, 
  addMember,
  inviteUser,
  joinProject
} = require('../controllers/projectController');

const { protect } = require('../middleware/authMiddleware');
const { checkProjectRole } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { projectSchema } = require('../validations/schemas');

router.route('/')
  .post(protect, projectSchema, validate, createProject)
  .get(protect, getProjects);

router.route('/:projectId')
  .get(protect, checkProjectRole(['owner', 'admin', 'member']), getProjectById)
  .put(protect, checkProjectRole(['owner', 'admin']), projectSchema, validate, updateProject)
  .delete(protect, checkProjectRole(['owner']), deleteProject);

router.post('/:projectId/members', protect, checkProjectRole(['owner', 'admin']), addMember);

router.post('/:projectId/invite', protect, checkProjectRole(['owner', 'admin']), inviteUser);
router.post('/:projectId/join', protect, joinProject);

module.exports = router;
