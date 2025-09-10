const express = require('express');
const { body, validationResult } = require('express-validator');
const { client } = require('../config/db');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for webhook endpoints
const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  message: { error: 'Too many webhook requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// HMAC signature verification middleware
const verifySignature = (req, res, next) => {
  const signature = req.headers['x-aiverse-signature'];
  const webhookSecret = process.env.WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('[Webhook] WEBHOOK_SECRET not configured, allowing request');
    return next();
  }
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing X-Aiverse-Signature header' });
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature !== `sha256=${expectedSignature}`) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
};

// Validation middleware for webhook content
const validateWebhookContent = [
  body('uuid').isString().notEmpty().withMessage('UUID is required'),
  body('timestamp').isString().matches(/^\d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}$/).withMessage('Invalid timestamp format'),
  body('eventType').isIn(['post_created', 'image_created', 'reel_created', 'comment_created', 'like_created']).withMessage('Invalid event type'),
  body('authorId').isString().notEmpty().withMessage('Author ID is required'),
  body('payload').isObject().withMessage('Payload is required'),
  body('hashtags').optional().isArray().withMessage('Hashtags must be an array'),
  body('mentions').optional().isArray().withMessage('Mentions must be an array'),
  body('parentId').optional().isString().withMessage('Parent ID must be a string'),
];

// POST /api/webhooks/content - Content ingestion endpoint
router.post('/content', webhookRateLimit, verifySignature, validateWebhookContent, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { uuid, timestamp, eventType, authorId, payload, hashtags = [], mentions = [], parentId } = req.body;
    const db = client.db('AIverse');

    // Check if content with this UUID already exists (idempotency check)
    const existingContent = await db.collection('content_ingest').findOne({ uuid });
    if (existingContent) {
      return res.status(200).json({ 
        message: 'Content already ingested', 
        id: existingContent._id 
      });
    }

    // Create content document
    const contentDoc = {
      uuid,
      timestamp,
      eventType,
      authorId,
      payload,
      hashtags,
      mentions,
      parentId,
      createdAt: new Date(),
      status: 'ingested',
      phases: ['ingested']
    };

    // Store in MongoDB
    const result = await db.collection('content_ingest').insertOne(contentDoc);
    const contentId = result.insertedId;

    // Broadcast real-time update via WebSocket
    if (global.io) {
      global.io.emit('content_update', {
        type: 'content_update',
        data: {
          phase: 'ingested',
          item: { ...contentDoc, _id: contentId }
        },
        timestamp: new Date().toISOString()
      });
    }

    // Start background processing (simulate moderation/enrichment)
    processContentAsync(contentId, eventType, payload, db);

    res.status(201).json({ 
      message: 'Content ingested', 
      id: contentId 
    });

  } catch (error) {
    console.error('[Webhook] Error ingesting content:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to ingest content'
    });
  }
});

// GET /api/content - List recent content
router.get('/content', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const db = client.db('AIverse');
    
    const content = await db.collection('content_ingest')
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    res.json({
      content,
      count: content.length,
      limit
    });

  } catch (error) {
    console.error('[Webhook] Error fetching content:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch content'
    });
  }
});

// Background processing function
async function processContentAsync(contentId, eventType, payload, db) {
  try {
    // Simulate moderation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update status to moderation complete
    await db.collection('content_ingest').updateOne(
      { _id: contentId },
      { 
        $set: { 
          status: 'moderation_complete',
          moderatedAt: new Date()
        },
        $push: { phases: 'moderation_complete' }
      }
    );

    // Broadcast moderation complete
    if (global.io) {
      const updatedContent = await db.collection('content_ingest').findOne({ _id: contentId });
      global.io.emit('content_update', {
        type: 'content_update',
        data: {
          phase: 'moderation_complete',
          item: updatedContent
        },
        timestamp: new Date().toISOString()
      });
    }

    // Simulate publishing delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update status to publish complete
    await db.collection('content_ingest').updateOne(
      { _id: contentId },
      { 
        $set: { 
          status: 'publish_complete',
          publishedAt: new Date()
        },
        $push: { phases: 'publish_complete' }
      }
    );

    // Broadcast publish complete
    if (global.io) {
      const updatedContent = await db.collection('content_ingest').findOne({ _id: contentId });
      global.io.emit('content_update', {
        type: 'content_update',
        data: {
          phase: 'publish_complete',
          item: updatedContent
        },
        timestamp: new Date().toISOString()
      });
    }

    // Handle specific event types
    if (eventType === 'like_created') {
      await handleLikeNotification(contentId, payload, db);
    }

  } catch (error) {
    console.error('[Webhook] Error in background processing:', error);
  }
}

// Handle like notifications
async function handleLikeNotification(contentId, payload, db) {
  try {
    const { postId, userId, likerName } = payload;
    
    // Create notification for the post author
    const notification = {
      userId: postId, // Assuming postId contains the author's ID
      type: 'like',
      message: `${likerName || 'Someone'} liked your post`,
      data: {
        postId,
        likerId: userId,
        likerName
      },
      createdAt: new Date(),
      read: false
    };

    await db.collection('notifications').insertOne(notification);

    // Broadcast notification to the user
    if (global.io) {
      global.io.emit('notification', {
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('[Webhook] Error handling like notification:', error);
  }
}

module.exports = router;