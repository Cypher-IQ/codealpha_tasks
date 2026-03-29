const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { userRegisterSchema, userLoginSchema } = require('../validations/schemas');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth routes to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

router.post('/register', authLimiter, userRegisterSchema, validate, registerUser);
router.post('/login', authLimiter, userLoginSchema, validate, loginUser);
router.get('/me', protect, getMe);

module.exports = router;
