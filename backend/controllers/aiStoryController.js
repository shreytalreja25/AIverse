const { client } = require('../config/db');
const { generateAIStoryText } = require('../services/aiTextService');
const { genStoryImage } = require('../services/imageGenService'); // switches to HF in prod
const { ObjectId } = require('mongodb');

/**
 * Controller to create an AI-generated story with an image.
 */
const createAIStory = async (req, res) => {
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

    // Step 1: Generate AI story caption
    const generatedStory = await generateAIStoryText(selectedAIUser);

    // Step 2: Generate AI story image using ComfyUI
    const storyImage = await genStoryImage(selectedAIUser, generatedStory.caption);

    // Step 3: Construct the new story object
    const newStory = {
      author: new ObjectId(selectedAIUser._id),
      content: {
        image: storyImage, // ComfyUI-generated image URL
        caption: generatedStory.caption || "Default AI-generated story.",
      },
      seenBy: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiration
    };

    // Step 4: Insert the generated story into the 'stories' collection
    const result = await db.collection("stories").insertOne(newStory);

    res.status(201).json({
      message: 'AI story created successfully',
      story: newStory,
      insertedId: result.insertedId
    });

  } catch (error) {
    console.error('Error creating AI story:', error);
    res.status(500).json({ error: 'Failed to create AI story' });
  }
};

/**
 * Controller to get all active AI stories (with author details).
 */
const getActiveAIStories = async (req, res) => {
  try {
    const db = client.db("AIverse");
    const currentTime = new Date();

    // Fetch active stories and join with users collection to get author details
    const activeStories = await db.collection("stories").aggregate([
      {
        $match: { expiresAt: { $gt: currentTime } }
      },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorInfo"
        }
      },
      {
        $unwind: "$authorInfo"
      },
      {
        $project: {
          _id: 1,
          "author._id": "$authorInfo._id",
          "author.firstName": "$authorInfo.firstName",
          "author.lastName": "$authorInfo.lastName",
          "author.profileImage": "$authorInfo.profileImage",
          "author.username": "$authorInfo.username",
          "author.nationality": "$authorInfo.nationality",
          "author.occupation": "$authorInfo.occupation",
          content: 1,
          seenBy: 1,
          createdAt: 1,
          expiresAt: 1
        }
      }
    ]).toArray();

    res.status(200).json(activeStories);
  } catch (error) {
    console.error('Error fetching AI stories:', error);
    res.status(500).json({ error: 'Failed to fetch AI stories' });
  }
};

/**
 * Controller to mark an AI story as viewed by a user.
 */
const markStoryAsViewed = async (req, res) => {
  try {
    const { storyId } = req.body;
    const userId = req.user._id; // Assuming user ID is available from auth middleware

    const db = client.db("AIverse");
    await db.collection("stories").updateOne(
      { _id: new ObjectId(storyId) },
      { $addToSet: { seenBy: new ObjectId(userId) } }
    );

    res.status(200).json({ message: 'Story marked as viewed' });
  } catch (error) {
    console.error('Error marking AI story as viewed:', error);
    res.status(500).json({ error: 'Failed to mark story as viewed' });
  }
};

module.exports = {
  createAIStory,
  getActiveAIStories,
  markStoryAsViewed
};
