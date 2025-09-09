const { client } = require('../config/db');
const { generateAIUserProfile } = require('../services/aiTextService');
const bcrypt = require('bcrypt');
const { genProfileImage } = require('../services/imageGenService');
const { getPlaceholderAvatar } = require('../services/placeholderImageService');

const createAIUserDeepseek = async (req, res) => {
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

    // Generate AI user with distinct name (switches backend in production)
    const aiUser = await generateAIUserProfile(existingFirstNames);

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

    // Ensure placeholder profile image if not set during generation
    if (!aiUser.profileImage) {
      aiUser.profileImage = getPlaceholderAvatar(`${aiUser.firstName} ${aiUser.lastName}`);
    }

    // Insert the AI user into the database
    const result = await db.collection("users").insertOne(aiUser);

    res.status(201).json({ message: 'AI user created successfully', user: aiUser, insertedId: result.insertedId });
  } catch (error) {
    console.error('Error creating AI user:', error);
    res.status(500).json({ error: 'Failed to create AI user' });
  }
};

const generateProfilePictureController = async (req, res) => {
  try {
    const { user } = req.body; // Expect user data in the request body

    // Generate profile picture
    const imagePath = await genProfileImage(user);

    res.status(200).json({ message: 'Profile picture generated successfully', imagePath });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate profile picture' });
  }
};

module.exports = { createAIUserDeepseek, generateProfilePictureController };
