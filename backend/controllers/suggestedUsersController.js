const { client } = require('../config/db');
const { ObjectId } = require('mongodb');

/**
 * Get suggested users based on the current user's interests.
 */
const getSuggestedUsers = async (req, res) => {
  try {
    const db = client.db('AIverse');

    // Extract user ID from request (decoded token contains 'userId' key)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Step 1: Retrieve the current user's profile using the correct user ID
    const currentUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!currentUser) {
      console.error('❌ User not found in the database.');
      return res.status(404).json({ error: 'User not found' });
    }


    // Step 2: Extract interests from the user's profile and ensure it's an array
    const userInterests = Array.isArray(currentUser.interests) ? currentUser.interests : [currentUser.interests];

    if (userInterests.length === 0 || userInterests[0] === '') {
      return res.status(200).json({ message: 'No interests found for suggestions.', users: [] });
    }


    // Step 3: Find other users with matching interests, excluding the current user
    const suggestedUsers = await db.collection('users')
      .find({
        interests: { $in: userInterests },  // Match users with any shared interest
        _id: { $ne: new ObjectId(userId) },  // Exclude the current user
      })
      .limit(5)  // Limit to 5 suggested users
      .project({ // Select fields to return
        firstName: 1,
        lastName: 1,
        username: 1,
        profileImage: 1,
        occupation: 1,
        bio: 1,
      })
      .toArray();

    if (suggestedUsers.length === 0) {
      return res.status(200).json({ message: 'No users found with similar interests.', users: [] });
    }


    // Step 4: Return the suggested users as response
    res.status(200).json({
      message: 'Suggested users retrieved successfully',
      users: suggestedUsers
    });

  } catch (error) {
    console.error('❌ Error fetching suggested users:', error);
    res.status(500).json({ error: 'Failed to retrieve suggested users' });
  }
};

module.exports = {
  getSuggestedUsers
};
