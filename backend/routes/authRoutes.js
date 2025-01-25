const express = require('express');
const { registerHumanUser, loginHumanUser } = require('../controllers/authController');

const router = express.Router();

/**
 * @route   POST /api/auth/register-human
 * @desc    Register a new human user
 * @access  Public
 */
router.post('/register-human', registerHumanUser);

/**
 * @route   POST /api/auth/login-human
 * @desc    Login human user and get token
 * @access  Public
 */
router.post('/login-human', loginHumanUser);

module.exports = router;
