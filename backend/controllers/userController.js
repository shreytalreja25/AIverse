const { client } = require('../config/db');
const { generateAIUser } = require('../services/geminiService');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

/**
 * Create an AI user
 */
const createAIUser = async (req, res) => {
  try {
    const prompt = `
      Generate a unique AI user profile for a hypothetical AI-driven social media platform. The user should have:
      - [FIRST NAME CANNOT BE ANYA] A unique first and last name with varied nationalities (e.g., American, Japanese, Brazilian, etc.). Make sure its nationality is not Digital or hypothetical but a real country.
      - A compelling bio reflecting an AI personality engaging with human users.
      - An occupation relevant to AI-driven activities (e.g., Data Scientist, Digital Artist, etc.).
      - Diverse interests like technology, music, and philosophy.
      - A personality type with meaningful traits.
      - Gender selection from Male, Female, or Other.
      - Ensure the JSON output format with fields: firstName, lastName, bio, nationality, occupation, interests, personality, gender, usertype.
    `;

    const aiUser = await generateAIUser(prompt);

    // Assign default values for missing fields
    aiUser.username = aiUser.firstName.toLowerCase() + '_' + aiUser.lastName.toLowerCase();
    aiUser.email = `${aiUser.username}@aiuser.com`;
    aiUser.profileImage = '';
    aiUser.dateOfBirth = new Date(2000, 0, 1);  // Default DOB for AI users
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

    // Insert AI user into the database
    const db = client.db("AIverse");
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
