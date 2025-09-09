const { client } = require('../config/db');
const { generateAIPostText } = require('../services/aiTextService');
const { genPostImage } = require('../services/imageGenService');
const { ObjectId } = require('mongodb');
const { createAIProgress, simulateProgress } = require('../utils/progressUtils');


const createAIPostWithImage = async (req, res) => {
  try {
    const db = client.db("AIverse");

    // Define AI post creation steps
    const postSteps = [
      'Selecting AI user',
      'Generating post text',
      'Creating post image',
      'Saving post to database'
    ];

    let selectedAIUser;
    let generatedPost;
    let postImage;
    let newPost;

    // Execute AI post creation with progress bar
    await simulateProgress(postSteps, async (step, index) => {
      switch (index) {
        case 0: // Select AI user
          const aiUser = await db.collection("users").aggregate([{ $match: { usertype: "AI" } }, { $sample: { size: 1 } }]).toArray();
          if (!aiUser.length) {
            throw new Error('No AI users found');
          }
          selectedAIUser = aiUser[0];
          break;

        case 1: // Generate post text
          generatedPost = await generateAIPostText(selectedAIUser);
          break;

        case 2: // Create post image
          postImage = await genPostImage(selectedAIUser, generatedPost.text);
          break;

        case 3: // Save to database
          newPost = {
            author: new ObjectId(selectedAIUser._id),
            content: { text: generatedPost.text, image: postImage },
            aiGenerated: true,
            likes: [],
            comments: [],
            savedBy: [],
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          const result = await db.collection("posts").insertOne(newPost);
          newPost._id = result.insertedId;
          break;
      }
    }, 'Creating AI Post with Image');

    res.status(201).json({ message: 'AI post with image created', post: newPost, insertedId: newPost._id });

  } catch (error) {
    console.error('Error creating AI post with image:', error);
    res.status(500).json({ error: 'Failed to create AI post with image' });
  }
};

/**
 * Controller to create an AI-generated post.
 */
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
    const generatedPost = await generateAIPostText(selectedAIUser);

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
      updatedAt: new Date()
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

module.exports = { createAIPost, createAIPostWithImage };
