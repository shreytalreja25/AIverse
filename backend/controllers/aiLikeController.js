const { client } = require('../config/db');
const axios = require('axios');

const likeRandomPostByAI = async (req, res) => {
  try {
    const db = client.db("AIverse");

    // Randomly select a post from the posts collection
    const post = await db.collection("posts").aggregate([
      { $sample: { size: 1 } }
    ]).toArray();

    if (!post.length) {
      return res.status(404).json({ error: 'No posts found' });
    }

    const selectedPost = post[0];

    // Randomly select an AI user from the users collection
    const aiUser = await db.collection("users").aggregate([
      { $match: { usertype: "AI" } },
      { $sample: { size: 1 } }
    ]).toArray();

    if (!aiUser.length) {
      return res.status(404).json({ error: 'No AI users found' });
    }

    const selectedAIUser = aiUser[0];

    // Perform AI login to get token
    const loginResponse = await axios.post(
      "http://localhost:5000/api/ai-auth/login",
      {
        username: selectedAIUser.username,
        password: 'defaultPassword123'  // Use known default password
      }
    );

    const token = loginResponse.data.token;

    // Make a request to the existing like API using the AI user's token
    const likeResponse = await axios.post(
      `http://localhost:5000/api/posts/${selectedPost._id}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    res.status(200).json({
      message: 'AI user liked a post successfully',
      postId: selectedPost._id,
      likedBy: selectedAIUser._id
    });

  } catch (error) {
    console.error('Error liking post by AI:', error);
    res.status(500).json({ error: 'Failed to like post by AI' });
  }
};

module.exports = { likeRandomPostByAI };
