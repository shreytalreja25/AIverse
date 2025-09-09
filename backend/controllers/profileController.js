const bcrypt = require('bcrypt');
const { client } = require('../config/db');
const { ObjectId } = require('mongodb');

/**
 * Get user profile by ID or username
 */
const getUserProfileById = async (req, res) => {
    try {
        const identifier = req.params.id;
        const db = client.db('AIverse');

        let user;
        
        // Check if identifier is a valid ObjectId
        if (ObjectId.isValid(identifier)) {
            // Search by user ID
            user = await db.collection('users').findOne(
                { _id: new ObjectId(identifier) },
                {
                    projection: {
                        passwordHash: 0, // Exclude sensitive data
                        security: 0,
                        loginHistory: 0
                    }
                }
            );
        } else {
            // Search by username
            user = await db.collection('users').findOne(
                { username: identifier },
                {
                    projection: {
                        passwordHash: 0, // Exclude sensitive data
                        security: 0,
                        loginHistory: 0
                    }
                }
            );
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

/**
 * Get user profile
 */
const getUserProfile = async (req, res) => {
    try {
        const db = client.db('AIverse');
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            bio: user.bio,
            nationality: user.nationality,
            occupation: user.occupation,
            socialLinks: user.socialLinks,
            profileImage: user.profileImage
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

/**
 * Update user profile
 */
const updateUserProfile = async (req, res) => {
    try {
        const { firstName, lastName, bio, nationality, occupation, socialLinks, location } = req.body;
        const profileImage = req.file ? req.file.path : null;

        const db = client.db('AIverse');
        const usersCollection = db.collection('users');

        const updatedData = {
            firstName,
            lastName,
            bio,
            nationality,
            occupation,
            ...(location ? { location: {
                city: location.city || '',
                country: location.country || '',
                lat: location.lat || null,
                lon: location.lon || null
            }} : {}),
            socialLinks: {
                facebook: socialLinks?.facebook || '',
                twitter: socialLinks?.twitter || '',
                instagram: socialLinks?.instagram || '',
                linkedin: socialLinks?.linkedin || ''
            },
            updatedAt: new Date()
        };

        if (profileImage) {
            updatedData.profileImage = profileImage;
        }

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(req.user.userId) },
            { $set: updatedData }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ message: 'No changes made to profile' });
        }

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

/**
 * Change user password
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const db = client.db('AIverse');
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await usersCollection.updateOne(
            { _id: new ObjectId(req.user.userId) },
            { $set: { passwordHash: hashedPassword, updatedAt: new Date() } }
        );

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};

/**
 * Delete user account
 */
const deleteUser = async (req, res) => {
    try {
        const db = client.db('AIverse');
        const usersCollection = db.collection('users');

        await usersCollection.deleteOne({ _id: new ObjectId(req.user.userId) });

        res.status(200).json({ message: 'User account deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user account' });
    }
};

module.exports = { getUserProfileById, getUserProfile, updateUserProfile, changePassword, deleteUser };
