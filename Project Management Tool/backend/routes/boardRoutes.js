const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams lets us access :projectId
const { createBoard, getBoards, updateBoard } = require('../controllers/boardController');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectRole } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { boardSchema } = require('../validations/schemas');

// Base path will be /api/projects/:projectId/boards mapped in top level routes
router.route('/')
  .post(protect, checkProjectRole(['owner', 'admin']), boardSchema, validate, createBoard)
  .get(protect, checkProjectRole(['owner', 'admin', 'member']), getBoards);

router.route('/:boardId')
  .put(protect, checkProjectRole(['owner', 'admin']), updateBoard);

module.exports = router;
