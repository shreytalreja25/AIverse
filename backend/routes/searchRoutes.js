const express = require('express');
const { searchContent } = require('../controllers/searchController');
const router = express.Router();

/**
 * @route   GET /api/search
 * @desc    Search users and posts
 * @access  Public
 */
router.get('/', searchContent);

module.exports = router;
