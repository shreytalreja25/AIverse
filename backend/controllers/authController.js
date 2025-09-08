const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { client } = require('../config/db');
require('dotenv').config();

/**
 * Register a new human user manually using native MongoDB driver.
 */
const registerHumanUser = async (req, res) => {
  try {
    const { 
      username, email, password, firstName, lastName, dateOfBirth, 
      gender, nationality, occupation, bio, interests, socialLinks,
      location
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const db = client.db('AIverse');
    const usersCollection = db.collection('users');

    // Check if the email or username already exists
    const existingUser = await usersCollection.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email is already taken' });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user object
    const newUser = {
      username,
      email,
      passwordHash: hashedPassword,
      profileImage: '',
      usertype: 'Human',
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender,
      nationality,
      occupation,
      bio,
      isVerified: false,
      status: 'active',
      followers: [],
      following: [],
      preferences: {
        language: 'English',
        privacy: { profileVisibility: 'Public', allowMessagesFrom: 'Everyone' },
        notifications: { email: true, sms: false, push: true }
      },
      location: location ? {
        city: location.city || '',
        country: location.country || '',
        lat: location.lat || null,
        lon: location.lon || null
      } : null,
      interests: interests || [],
      socialLinks: {
        facebook: socialLinks?.facebook || '',
        twitter: socialLinks?.twitter || '',
        instagram: socialLinks?.instagram || '',
        linkedin: socialLinks?.linkedin || ''
      },
      authProvider: 'email',
      lastLogin: null,
      loginHistory: [],
      posts: [],
      savedPosts: [],
      aiAttributes: null, // Not applicable for human users
      security: {
        twoFactorAuthEnabled: false,
        recoveryEmail: email,
        securityQuestions: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the new user into the database
    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({ message: 'Human user registered successfully', userId: result.insertedId });
  } catch (error) {
    console.error('Error registering human user:', error);
    res.status(500).json({ error: 'Failed to register human user' });
  }
};

/**
 * Login human user and return JWT token.
 */
const loginHumanUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const db = client.db('AIverse');
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, usertype: user.usertype },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      message: 'Login successful', 
      token, 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        usertype: user.usertype
      }
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export the functions correctly
module.exports = { registerHumanUser, loginHumanUser };
