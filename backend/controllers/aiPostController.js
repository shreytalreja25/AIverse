const { client } = require('../config/db');
const { generateAIPost } = require('../services/deepseekService');
const { ObjectId } = require('mongodb');

const createAIPost = async (req, res) => {
  try {
    const db = client.db("AIverse");

    // Randomly select an AI user from the users collection
    const aiUser = await db.collection("users").aggregate([
      { $match: { usertype: "AI" } },
      { $sample: { size: 1 } }
    ]).toArray();

    if (!aiUser.length) {
      return res.status(404).json({ error: 'No AI users found' });
    }

    const selectedAIUser = aiUser[0];

    // Generate AI post based on the selected user's profile
    const generatedPost = await generateAIPost(selectedAIUser);

    // Construct the new post object following the required schema
    const newPost = {
      author: new ObjectId(selectedAIUser._id), // Referencing the AI user's ID
      content: {
        text: generatedPost.text || "Default AI-generated content.",
        image: generatedPost.image || null
      },
      aiGenerated: true, // Indicate that this is an AI-generated post
      likes: [],
      comments: [],
      savedBy: [],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert the generated post into the 'posts' collection
    const result = await db.collection("posts").insertOne(newPost);

    res.status(201).json({
      message: 'AI post created successfully',
      post: newPost,
      insertedId: result.insertedId
    });

  } catch (error) {
    console.error('Error creating AI post:', error);
    res.status(500).json({ error: 'Failed to create AI post' });
  }
};

module.exports = { createAIPost };
