const { IS_PROD } = require('../config/env');
const { getPlaceholderPostImage } = require('./placeholderImageService');

// Text generation backends
const deepseek = require('./deepseekService');
const gemini = require('./geminiService');

const textBackend = IS_PROD ? gemini : deepseek;

async function generateAIUserProfile(existingNames) {
  // deepseekService and geminiService both export generateAIUserUsingDeepseek/generateAIUser
  if (IS_PROD) {
    // Gemini path
    try {
      return await gemini.generateAIUser(existingNames);
    } catch (e) {
      // Soft fallback to DeepSeek in prod if Gemini fails (e.g., missing key)
      try {
        return await deepseek.generateAIUserUsingDeepseek(existingNames);
      } catch (_) {
        // Last resort minimal stub to keep flows running
        const firstName = `AI${Math.floor(Math.random()*1000)}`;
        return {
          firstName,
          lastName: 'User',
          bio: 'AI-generated persona',
          nationality: 'Global',
          occupation: 'Information Architect',
          interests: ['AI','Data','Art'],
          personality: { type: 'Analytical', tagwords: ['Curious','Helpful'] },
          gender: 'Other',
          usertype: 'AI'
        };
      }
    }
  }
  return await deepseek.generateAIUserUsingDeepseek(existingNames);
}

async function generateAIPostText(aiUser) {
  if (IS_PROD) {
    try {
      return await gemini.generateAIPost(aiUser);
    } catch (e) {
      // Fallback chain
      try {
        return await deepseek.generateAIPost(aiUser);
      } catch (_) {
        return { text: `Hello from ${aiUser.firstName} ${aiUser.lastName}!`, image: getPlaceholderPostImage('AIverse Post') };
      }
    }
  }
  return await deepseek.generateAIPost(aiUser);
}

async function generateAIStoryText(aiUser) {
  if (IS_PROD) {
    // Reuse post generator prompt as story; gemini service does not have explicit story API
    try {
      const post = await gemini.generateAIPost(aiUser);
      return { image: null, caption: post.text };
    } catch (e) {
      try {
        const post = await deepseek.generateAIPost(aiUser);
        return { image: null, caption: post.text };
      } catch (_) {
        return { image: null, caption: `Updates from ${aiUser.firstName} ${aiUser.lastName}` };
      }
    }
  }
  return await deepseek.generateAIStory(aiUser);
}

async function generateAICommentText(post, aiUser) {
  if (IS_PROD) {
    // Simple comment using post + user context with gemini post generator
    try {
      const generated = await gemini.generateAIPost(aiUser);
      return { text: generated.text?.slice(0, 240) || 'Nice!' };
    } catch (e) {
      try {
        const generated = await deepseek.generateAIPost(aiUser);
        return { text: generated.text?.slice(0, 240) || 'Nice!' };
      } catch (_) {
        return { text: 'Nice!' };
      }
    }
  }
  return await deepseek.generateAIComment(post, aiUser);
}

async function generateAIReplyText(comment, aiUser) {
  if (IS_PROD) {
    try {
      const generated = await gemini.generateAIPost(aiUser);
      return { text: generated.text?.slice(0, 240) || 'Totally agree!' };
    } catch (e) {
      try {
        const generated = await deepseek.generateAIPost(aiUser);
        return { text: generated.text?.slice(0, 240) || 'Totally agree!' };
      } catch (_) {
        return { text: 'Totally agree!' };
      }
    }
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

