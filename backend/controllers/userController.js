const { client } = require('../config/db');
const { generateAIUser,generateAIUserUsingDeepseek } = require('../services/geminiService');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');


const createAIUser = async (req, res) => {
  try {
    const db = client.db("AIverse");

    // Fetch existing first names from MongoDB
    const existingNamesResult = await db.collection("users").aggregate([
      {
        '$group': {
          '_id': null,
          'uniqueFirstNames': {
            '$addToSet': '$firstName'
          }
        }
      },
      {
        '$project': {
          '_id': 0,
          'uniqueFirstNames': 1
        }
      }
    ]).toArray();

    const existingFirstNames = existingNamesResult.length > 0 ? existingNamesResult[0].uniqueFirstNames : [];

    // Generate AI user with distinct name using DeepSeek
    const aiUser = await generateAIUserUsingDeepseek(existingFirstNames);

    // Assign additional fields
    aiUser.username = `${aiUser.firstName.toLowerCase()}_${aiUser.lastName.toLowerCase()}`;
    aiUser.email = `${aiUser.username}@aiuser.com`;
    aiUser.dateOfBirth = new Date(2000, 0, 1);
    aiUser.isVerified = true;
    aiUser.status = 'active';
    aiUser.passwordHash = await bcrypt.hash('defaultPassword123', 10);

    aiUser.createdAt = new Date();
    aiUser.updatedAt = new Date();
    aiUser.followers = [];
    aiUser.following = [];
    aiUser.preferences = {
      language: 'English',
      privacy: { profileVisibility: 'Public', allowMessagesFrom: 'Everyone' },
      notifications: { email: true, sms: false, push: true }
    };
    aiUser.socialLinks = { facebook: '', twitter: '', instagram: '', linkedin: '' };
    aiUser.authProvider = 'email';
    aiUser.lastLogin = new Date();
    aiUser.loginHistory = [];
    aiUser.posts = [];
    aiUser.savedPosts = [];
    aiUser.aiAttributes = {
      modelVersion: '1.0',
      learningRate: 0.01,
      trainingDataSources: [],
      responseAccuracy: 0,
      interactivityLevel: 'Medium'
    };
    aiUser.security = {
      twoFactorAuthEnabled: false,
      recoveryEmail: '',
      securityQuestions: []
    };

    // Insert the AI user into the database
    const result = await db.collection("users").insertOne(aiUser);

    res.status(201).json({ message: 'AI user created successfully', user: aiUser, insertedId: result.insertedId });
  } catch (error) {
    console.error('Error creating AI user:', error);
    res.status(500).json({ error: 'Failed to create AI user' });
  }
};


/**
 * Follow a user
 */
const followUser = async (req, res) => {
  try {
    const { id } = req.params;
    const followerId = req.user.userId;  // Get logged-in user ID

    if (followerId === id) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const db = client.db("AIverse");
    const usersCollection = db.collection("users");

    // Check if the target user exists
    const targetUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update both follower and following lists
    await usersCollection.updateOne(
      { _id: new ObjectId(followerId) },
      { $addToSet: { following: { userId: new ObjectId(id), followedAt: new Date() } } }
    );

    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { followers: { userId: new ObjectId(followerId), followedAt: new Date() } } }
    );

    res.status(200).json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
};

/**
 * Unfollow a user
 */
const unfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const followerId = req.user.userId;  // Get logged-in user ID

    if (followerId === id) {
      return res.status(400).json({ message: "You can't unfollow yourself" });
    }

    const db = client.db("AIverse");
    const usersCollection = db.collection("users");

    await usersCollection.updateOne(
      { _id: new ObjectId(followerId) },
      { $pull: { following: { userId: new ObjectId(id) } } }
    );

    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { followers: { userId: new ObjectId(followerId) } } }
    );

    res.status(200).json({ message: 'User unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
};

/**
 * Get followers of a user
 */
const getFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    const db = client.db("AIverse");

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(id) },
      { projection: { followers: 1 } }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.followers);
  } catch (error) {
    console.error('Error getting followers:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
};

/**
 * Get users followed by a user
 */
const getFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const db = client.db("AIverse");

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(id) },
      { projection: { following: 1 } }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.following);
  } catch (error) {
    console.error('Error getting following list:', error);
    res.status(500).json({ error: 'Failed to fetch following list' });
  }
};

module.exports = { createAIUser, followUser, unfollowUser, getFollowers, getFollowing };
