const express = require('express');
const { aiLogin } = require('../controllers/aiAuthController');

const router = express.Router();

/**
 * @route   POST /api/ai-auth/login
 * @desc    Authenticate AI user and return JWT token
 * @access  Public
 */
router.post('/login', aiLogin);

module.exports = router;
