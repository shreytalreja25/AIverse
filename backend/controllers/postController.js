const { client } = require('../config/db');
const { ObjectId } = require('mongodb');

/**
 * Create a new post
 */
const createPost = async (req, res) => {
    try {
        const { text, image, aiGenerated } = req.body;
        const userId = req.user.userId;
        const newPost = {
            author: new ObjectId(userId),
            content: { text, image },
            aiGenerated: aiGenerated || false,
            likes: [],
            comments: [],
            savedBy: [],
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const db = client.db('AIverse');
        const result = await db.collection('posts').insertOne(newPost);

        res.status(201).json({ message: 'Post created successfully', postId: result.insertedId });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
};

/**
 * Get all posts (with pagination)
 */
const getAllPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const db = client.db('AIverse');

        const posts = await db.collection('posts').aggregate([
            {
                $match: { isDeleted: false } // Fetch only non-deleted posts
            },
            {
                $sort: { createdAt: -1 } // Sort by newest posts first
            },
            {
                $skip: (parseInt(page) - 1) * parseInt(limit) // Pagination skip
            },
            {
                $limit: parseInt(limit) // Limit number of posts per page
            },
            {
                $lookup: {
                    from: 'users',  // Name of the users collection
                    localField: 'author',
                    foreignField: '_id',
                    as: 'authorInfo'
                }
            },
            {
                $unwind: "$authorInfo" // Convert authorInfo array to object
            },
            {
                $project: {
                    _id: 1,
                    "content.text": 1,
                    "content.image": 1,
                    aiGenerated: 1,
                    likes: 1,
                    comments: 1,
                    savedBy: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    "authorInfo.firstName": 1,
                    "authorInfo.lastName": 1,
                    "authorInfo.username": 1,
                    "authorInfo.profileImage": 1
                }
            }
        ]).toArray();

        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
};

/**
 * Get a single post by ID
 */
const getPostById = async (req, res) => {
    try {
        const postId = req.params.id;
        const db = client.db('AIverse');

        const post = await db.collection('posts').aggregate([
            {
                $match: {
                    _id: new ObjectId(postId),
                    isDeleted: false
                }
            },
            {
                $lookup: {
                    from: 'users',  // Collection to join
                    localField: 'author',
                    foreignField: '_id',
                    as: 'authorInfo'
                }
            },
            {
                $unwind: '$authorInfo'  // Flatten the author array
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    aiGenerated: 1,
                    likes: 1,
                    comments: 1,
                    savedBy: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    authorInfo: {
                        username: '$authorInfo.username',
                        profileImage: '$authorInfo.profileImage',
                        firstName: '$authorInfo.firstName',
                        lastName: '$authorInfo.lastName'
                    }
                }
            }
        ]).toArray();

        if (post.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json(post[0]);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
};

/**
 * Get all posts by a specific user
 */
const getPostsByUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const db = client.db('AIverse');

        // Aggregate posts with user information
        const posts = await db.collection('posts').aggregate([
            {
                $match: {
                    author: new ObjectId(userId),
                    isDeleted: false
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'authorInfo'
                }
            },
            {
                $unwind: '$authorInfo'
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    aiGenerated: 1,
                    likes: 1,
                    comments: 1,
                    savedBy: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    'authorInfo.username': 1,
                    'authorInfo.profileImage': 1,
                    'authorInfo.firstName': 1,
                    'authorInfo.lastName': 1
                }
            }
        ]).toArray();

        if (!posts.length) {
            return res.status(404).json({ message: 'No posts found for this user' });
        }

        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts for the user' });
    }
};


/**
 * Update a post
 */
const updatePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const { text, image } = req.body;
        const db = client.db('AIverse');

        const result = await db.collection('posts').updateOne(
            { _id: new ObjectId(postId) },
            { $set: { 'content.text': text, 'content.image': image, updatedAt: new Date() } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Post not found or no changes made' });
        }

        res.status(200).json({ message: 'Post updated successfully' });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
};

/**
 * Soft delete a post
 */
const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const db = client.db('AIverse');

        const result = await db.collection('posts').updateOne(
            { _id: new ObjectId(postId) },
            { $set: { isDeleted: true, updatedAt: new Date() } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
};


/**
 * Like a post
 */
const likePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.userId;
        const db = client.db('AIverse');

        // Check if the user already liked the post
        const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });

        if (post.likes.some(like => like.user.toString() === userId)) {
            return res.status(400).json({ message: 'Post already liked' });
        }

        await db.collection('posts').updateOne(
            { _id: new ObjectId(postId) },
            { $push: { likes: { user: new ObjectId(userId), likedAt: new Date() } } }
        );

        res.status(200).json({ message: 'Post liked successfully' });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ error: 'Failed to like post' });
    }
};

/**
 * Unlike a post
 */
const unlikePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.userId;
        const db = client.db('AIverse');

        await db.collection('posts').updateOne(
            { _id: new ObjectId(postId) },
            { $pull: { likes: { user: new ObjectId(userId) } } }
        );

        res.status(200).json({ message: 'Post unliked successfully' });
    } catch (error) {
        console.error('Error unliking post:', error);
        res.status(500).json({ error: 'Failed to unlike post' });
    }
};

/**
 * Add a comment to a post
 */
const addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.userId;
        const { text } = req.body;
        const db = client.db('AIverse');

        const newComment = {
            _id: new ObjectId(),
            user: new ObjectId(userId),
            text,
            commentedAt: new Date()
        };

        await db.collection('posts').updateOne(
            { _id: new ObjectId(postId) },
            { $push: { comments: newComment } }
        );

        res.status(201).json({ message: 'Comment added successfully', commentId: newComment._id });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

/**
 * Edit a comment
 */
const editComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { text } = req.body;
        const db = client.db('AIverse');

        const result = await db.collection('posts').updateOne(
            { _id: new ObjectId(postId), "comments._id": new ObjectId(commentId) },
            { $set: { "comments.$.text": text, "comments.$.commentedAt": new Date() } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Comment not found or no changes made' });
        }

        res.status(200).json({ message: 'Comment updated successfully' });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ error: 'Failed to update comment' });
    }
};

/**
 * Delete a comment
 */
const deleteComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const db = client.db('AIverse');

        const result = await db.collection('posts').updateOne(
            { _id: new ObjectId(postId) },
            { $pull: { comments: { _id: new ObjectId(commentId) } } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
};


/**
 * Save a post
 */
const savePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.userId;
        const db = client.db('AIverse');

        const result = await db.collection('posts').updateOne(
            { _id: new ObjectId(postId) },
            { $addToSet: { savedBy: new ObjectId(userId) } }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ message: 'Post already saved' });
        }

        res.status(200).json({ message: 'Post saved successfully' });
    } catch (error) {
        console.error('Error saving post:', error);
        res.status(500).json({ error: 'Failed to save post' });
    }
};

/**
 * Unsave a post
 */
const unsavePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.userId;
        const db = client.db('AIverse');

        const result = await db.collection('posts').updateOne(
            { _id: new ObjectId(postId) },
            { $pull: { savedBy: new ObjectId(userId) } }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ message: 'Post not saved' });
        }

        res.status(200).json({ message: 'Post unsaved successfully' });
    } catch (error) {
        console.error('Error unsaving post:', error);
        res.status(500).json({ error: 'Failed to unsave post' });
    }
};

/**
 * Get saved posts by user
 */
const getSavedPosts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const db = client.db('AIverse');

        const posts = await db.collection('posts')
            .find({ savedBy: new ObjectId(userId), isDeleted: false })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching saved posts:', error);
        res.status(500).json({ error: 'Failed to fetch saved posts' });
    }
};

/**
 * Generate an AI post
 */
const generateAIPost = async (req, res) => {
    try {
        const db = client.db('AIverse');

        // Step 1: Select a random AI user
        const aiUser = await db.collection('users').aggregate([
            { $match: { usertype: 'AI' } },
            { $sample: { size: 1 } }
        ]).toArray();

        if (!aiUser.length) {
            return res.status(404).json({ message: 'No AI users found' });
        }

        const selectedAIUser = aiUser[0];

        // Step 2: Prepare prompt using AI user's profile data
        const prompt = `
            Generate a social media post for the AI user named ${selectedAIUser.firstName} ${selectedAIUser.lastName},
            who is an ${selectedAIUser.occupation}. They are interested in ${selectedAIUser.interests.join(", ")}.
            Their personality traits include ${selectedAIUser.personality.tagwords.join(", ")}.
            Make the post engaging and in a friendly tone.
        `;

        // Step 3: Use Gemini API to generate post content
        const aiGeneratedContent = await generateAIPost(prompt);

        if (!aiGeneratedContent || !aiGeneratedContent.text) {
            return res.status(500).json({ message: 'Failed to generate AI content' });
        }

        // Step 4: Store AI-generated post in the database
        const newPost = {
            author: new ObjectId(selectedAIUser._id),
            content: { text: aiGeneratedContent.text, image: aiGeneratedContent.image || null },
            aiGenerated: true,
            likes: [],
            comments: [],
            savedBy: [],
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('posts').insertOne(newPost);

        res.status(201).json({
            message: 'AI post generated successfully',
            postId: result.insertedId,
            author: `${selectedAIUser.firstName} ${selectedAIUser.lastName}`
        });

    } catch (error) {
        console.error('Error generating AI post:', error);
        res.status(500).json({ error: 'Failed to generate AI post' });
    }
};

/**
 * Get all AI-generated posts
 */
const getAIPosts = async (req, res) => {
    try {
        const db = client.db('AIverse');

        const aiPosts = await db.collection('posts')
            .find({ aiGenerated: true, isDeleted: false })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json(aiPosts);
    } catch (error) {
        console.error('Error fetching AI posts:', error);
        res.status(500).json({ error: 'Failed to fetch AI posts' });
    }
};

/**
 * Get similar posts to a given post id based on overlapping keywords in content.text
 */
const getSimilarPosts = async (req, res) => {
    try {
        const { id } = req.params;
        const db = client.db('AIverse');

        // Fetch the reference post
        const basePost = await db.collection('posts').findOne({ _id: new ObjectId(id) });
        if (!basePost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const text = basePost?.content?.text || '';
        // Extract simple keywords (length >= 4) and dedupe
        const keywords = Array.from(new Set(
            text
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, ' ')
                .split(/\s+/)
                .filter(w => w && w.length >= 4)
        )).slice(0, 8);

        const orClauses = keywords.map(kw => ({ 'content.text': { $regex: kw, $options: 'i' } }));

        // Fallback: if no keywords, just return recent posts excluding the same one
        const query = {
            _id: { $ne: new ObjectId(id) },
            isDeleted: false,
            ...(orClauses.length ? { $or: orClauses } : {})
        };

        const similar = await db.collection('posts')
            .find(query)
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        res.status(200).json(similar);
    } catch (error) {
        console.error('Error fetching similar posts:', error);
        res.status(500).json({ error: 'Failed to fetch similar posts' });
    }
};

/**
 * Add a reply to a specific comment on a post
 */
const addReply = async (req, res) => {
    try {
        const db = client.db('AIverse');
        const { postId, commentId } = req.params;
        const { text } = req.body;

        // Validate input
        if (!text || text.trim() === "") {
            return res.status(400).json({ error: 'Reply text cannot be empty.' });
        }

        // Construct the reply object
        const reply = {
            _id: new ObjectId(),
            user: new ObjectId(req.user.userId),  // Get user ID from JWT token
            text,
            repliedAt: new Date(),
        };

        // Update the post with the new reply inside the correct comment
        const result = await db.collection("posts").updateOne(
            { _id: new ObjectId(postId), "comments._id": new ObjectId(commentId) },
            {
                $push: {
                    "comments.$.replies": reply
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Post or comment not found.' });
        }

        res.status(201).json({ message: 'Reply added successfully', reply });
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({ error: 'Failed to add reply' });
    }
};

module.exports = { 
    createPost, 
    getAllPosts, 
    getPostById, 
    updatePost, 
    deletePost, 
    likePost, 
    unlikePost, 
    addComment, 
    editComment, 
    deleteComment,
    savePost, 
    unsavePost, 
    getSavedPosts,
    generateAIPost, 
    getAIPosts,
    getPostsByUser,
    addReply,
    getSimilarPosts
};