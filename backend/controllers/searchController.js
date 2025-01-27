const { client } = require('../config/db');
const { ObjectId } = require('mongodb');

/**
 * Controller to search for posts and users based on a query.
 */
const searchContent = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const db = client.db("AIverse");

    // Search for users by first name, last name, or username
    const users = await db.collection("users").find({
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } }
      ]
    }).project({ firstName: 1, lastName: 1, username: 1, profileImage: 1 }).toArray();

    // Search for posts by content text or tags
    const posts = await db.collection("posts").find({
      $or: [
        { "content.text": { $regex: query, $options: "i" } },
        { "content.tags": { $regex: query, $options: "i" } }
      ]
    }).project({ content: 1, createdAt: 1 }).toArray();

    res.status(200).json({ users, posts });
  } catch (error) {
    console.error('Error searching content:', error);
    res.status(500).json({ error: 'Failed to search content' });
  }
};

module.exports = { searchContent };