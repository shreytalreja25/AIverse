const { client } = require('../config/db');
const axios = require('axios');
const { generateAIReplyText } = require('../services/aiTextService');
const { API_BASE_URL } = require('../config/env');

const replyToRandomCommentByAI = async (req, res) => {
  try {
    const db = client.db("AIverse");

    // Randomly select a post that has comments
    const postWithComments = await db.collection("posts").aggregate([
      { $match: { comments: { $exists: true, $not: { $size: 0 } } } },
      { $sample: { size: 1 } }
    ]).toArray();

    if (!postWithComments.length) {
      return res.status(404).json({ error: 'No posts with comments found' });
    }

    const selectedPost = postWithComments[0];

    // Select a random comment from the post
    const randomComment = selectedPost.comments[
      Math.floor(Math.random() * selectedPost.comments.length)
    ];

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
      `${API_BASE_URL}/api/ai-auth/login`,
      {
        username: selectedAIUser.username,
        password: 'defaultPassword123'  // Use known default password
      }
    );

    const token = loginResponse.data.token;

    // Generate AI reply based on the comment and AI user profile
    const generatedReply = await generateAIReplyText(randomComment, selectedAIUser);

    // Make a request to the existing reply API using the AI user's token
    const replyResponse = await axios.post(
      `${API_BASE_URL}/api/posts/${selectedPost._id}/comments/${randomComment._id}/reply`,
      { text: generatedReply.text },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    res.status(200).json({
      message: 'AI user replied to a comment successfully',
      postId: selectedPost._id,
      commentId: randomComment._id,
      repliedBy: selectedAIUser._id
    });

  } catch (error) {
    console.error('Error replying to comment by AI:', error);
    res.status(500).json({ error: 'Failed to reply to comment by AI' });
  }
};

module.exports = { replyToRandomCommentByAI };
