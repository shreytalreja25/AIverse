const axios = require('axios');
const { generatePostImage } = require('./postImageService');
const { generateProfilePicture } = require('./profileImageService');
const { generateStoryImage } = require('./storyImageService');
const { IS_PROD, HUGGINGFACE_API_KEY, HF_TXT2IMG_MODEL } = require('../config/env');

// Simple free image generation using Hugging Face Inference API (text-to-image)
// Requires env HUGGINGFACE_API_KEY in prod
async function hfTextToImage(prompt) {
  const apiKey = HUGGINGFACE_API_KEY;
  const primaryModel = HF_TXT2IMG_MODEL;
  const fallbackModel = 'stabilityai/stable-diffusion-2-1';
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY missing');

  async function requestModel(model) {
    const url = `https://api-inference.huggingface.co/models/${model}`;
    return axios.post(url, { inputs: prompt }, {
      headers: { Authorization: `Bearer ${apiKey}` },
      responseType: 'arraybuffer'
    });
  }

  try {
    const res = await requestModel(primaryModel);
    const base64 = Buffer.from(res.data, 'binary').toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (err) {
    // If 404 or 5xx, try fallback model
    const status = err?.response?.status;
    if (status === 404 || (status >= 500 && status < 600)) {
      const res = await requestModel(fallbackModel);
      const base64 = Buffer.from(res.data, 'binary').toString('base64');
      return `data:image/png;base64,${base64}`;
    }
    throw err;
  }
}

async function genProfileImage(user) {
  if (!IS_PROD) return await generateProfilePicture(user);
  const prompt = `Portrait profile picture of ${user.firstName} ${user.lastName}, ${user.gender}, ${user.occupation}. Clean background, professional.`;
  return await hfTextToImage(prompt);
}

async function genPostImage(user, postText) {
  if (!IS_PROD) return await generatePostImage(user, postText);
  const prompt = `Social media post image. Theme based on: ${postText}. Aesthetic, modern.`;
  return await hfTextToImage(prompt);
}

async function genStoryImage(user, storyText) {
  if (!IS_PROD) return await generateStoryImage(user, storyText);
  const prompt = `Instagram story style image for ${user.firstName}. Caption context: ${storyText}.`;
  return await hfTextToImage(prompt);
}

module.exports = { genProfileImage, genPostImage, genStoryImage };


