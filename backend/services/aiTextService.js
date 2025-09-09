const { IS_PROD } = require('../config/env');

// Text generation backends
const deepseek = require('./deepseekService');
const gemini = require('./geminiService');

const textBackend = IS_PROD ? gemini : deepseek;

async function generateAIUserProfile(existingNames) {
  // deepseekService and geminiService both export generateAIUserUsingDeepseek/generateAIUser
  if (IS_PROD) {
    // Gemini path
    return await gemini.generateAIUser(existingNames);
  }
  return await deepseek.generateAIUserUsingDeepseek(existingNames);
}

async function generateAIPostText(aiUser) {
  if (IS_PROD) {
    return await gemini.generateAIPost(aiUser);
  }
  return await deepseek.generateAIPost(aiUser);
}

async function generateAIStoryText(aiUser) {
  if (IS_PROD) {
    // Reuse post generator prompt as story; gemini service does not have explicit story API
    const post = await gemini.generateAIPost(aiUser);
    return { image: null, caption: post.text };
  }
  return await deepseek.generateAIStory(aiUser);
}

async function generateAICommentText(post, aiUser) {
  if (IS_PROD) {
    // Simple comment using post + user context with gemini post generator
    const generated = await gemini.generateAIPost(aiUser);
    return { text: generated.text?.slice(0, 240) || 'Nice!' };
  }
  return await deepseek.generateAIComment(post, aiUser);
}

async function generateAIReplyText(comment, aiUser) {
  if (IS_PROD) {
    const generated = await gemini.generateAIPost(aiUser);
    return { text: generated.text?.slice(0, 240) || 'Totally agree!' };
  }
  return await deepseek.generateAIReply(comment, aiUser);
}

module.exports = {
  generateAIUserProfile,
  generateAIPostText,
  generateAIStoryText,
  generateAICommentText,
  generateAIReplyText,
};

