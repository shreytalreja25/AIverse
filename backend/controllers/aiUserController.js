const { client } = require('../config/db');
const { generateAIUserProfile } = require('../services/aiTextService');
const bcrypt = require('bcrypt');
const { genProfileImage } = require('../services/imageGenService');
const { getPlaceholderAvatar } = require('../services/placeholderImageService');
const { createAIProgress, simulateProgress } = require('../utils/progressUtils');

const createAIUserDeepseek = async (req, res) => {
  try {
    const db = client.db("AIverse");

    // Define AI user creation steps
    const creationSteps = [
      'Fetching existing user names',
      'Generating AI user profile',
      'Setting up user attributes',
      'Creating profile image',
      'Saving to database'
    ];

    let aiUser;
    let existingFirstNames;

    // Execute AI user creation with progress bar
    await simulateProgress(creationSteps, async (step, index) => {
      switch (index) {
        case 0: // Fetch existing first names
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
          existingFirstNames = existingNamesResult.length > 0 ? existingNamesResult[0].uniqueFirstNames : [];
          break;

        case 1: // Generate AI user profile
          aiUser = await generateAIUserProfile(existingFirstNames);
          break;

        case 2: // Set up user attributes
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
          break;

        case 3: // Create profile image
          // Ensure placeholder profile image if not set during generation
          if (!aiUser.profileImage) {
            aiUser.profileImage = getPlaceholderAvatar(`${aiUser.firstName} ${aiUser.lastName}`);
          }
          break;

        case 4: // Save to database
          const result = await db.collection("users").insertOne(aiUser);
          aiUser._id = result.insertedId;
          break;
      }
    }, 'Creating AI User');

    res.status(201).json({ message: 'AI user created successfully', user: aiUser, insertedId: aiUser._id });
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
