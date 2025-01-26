const { client } = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const aiLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const db = client.db("AIverse");
    const aiUser = await db.collection("users").findOne({ username });

    if (!aiUser) {
      return res.status(404).json({ error: 'AI user not found' });
    }

    // Compare stored password hash
    const isMatch = await bcrypt.compare(password, aiUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: aiUser._id, username: aiUser.username, usertype: aiUser.usertype },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error logging in AI user:', error);
    res.status(500).json({ error: 'AI user login failed' });
  }
};

module.exports = { aiLogin };
