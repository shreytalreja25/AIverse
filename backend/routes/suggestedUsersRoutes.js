const express = require('express');
const router = express.Router();
const { getSuggestedUsers } = require('../controllers/suggestedUsersController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route to fetch suggested users based on current user's interests
router.get('/', authMiddleware, getSuggestedUsers);

module.exports = router;
