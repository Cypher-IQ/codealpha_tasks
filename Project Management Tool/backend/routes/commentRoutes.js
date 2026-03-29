const express = require('express');
const router = express.Router({ mergeParams: true });
const { addComment, getComments } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectRole } = require('../middleware/roleMiddleware');

router.route('/')
  .post(protect, checkProjectRole(['owner', 'admin', 'member']), addComment)
  .get(protect, checkProjectRole(['owner', 'admin', 'member']), getComments);

module.exports = router;
