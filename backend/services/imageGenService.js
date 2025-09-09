const axios = require('axios');
const { generatePostImage } = require('./postImageService');
const { generateProfilePicture } = require('./profileImageService');
const { generateStoryImage } = require('./storyImageService');
const { getPlaceholderAvatar, getPlaceholderPostImage, getPlaceholderStoryImage } = require('./placeholderImageService');
const { IS_PROD, HUGGINGFACE_API_KEY, HF_TXT2IMG_MODEL } = require('../config/env');

// Simple free image generation using Hugging Face Inference API (text-to-image)
// Requires env HUGGINGFACE_API_KEY in prod
async function hfTextToImage(prompt) {
  const apiKey = HUGGINGFACE_API_KEY;
  const primaryModel = HF_TXT2IMG_MODEL;
  // Use a widely available public model id. 2-1 endpoint often 404s on HF Inference API
  const fallbackModel = 'runwayml/stable-diffusion-v1-5';
  if (!apiKey) return null;

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
      try {
        const res = await requestModel(fallbackModel);
        const base64 = Buffer.from(res.data, 'binary').toString('base64');
        return `data:image/png;base64,${base64}`;
      } catch (e) {
        // Final fallback to placeholder
        return null;
      }
    }
    return null;
  }
}

async function genProfileImage(user) {
  try {
    if (!IS_PROD) return await generateProfilePicture(user);
  } catch (_) {}
  const prompt = `Portrait profile picture of ${user.firstName} ${user.lastName}, ${user.gender}, ${user.occupation}. Clean background, professional.`;
  const img = await hfTextToImage(prompt);
  return img || getPlaceholderAvatar(`${user.firstName} ${user.lastName}`);
}

async function genPostImage(user, postText) {
  try {
    if (!IS_PROD) return await generatePostImage(user, postText);
  } catch (_) {}
  const prompt = `Social media post image. Theme based on: ${postText}. Aesthetic, modern.`;
  const img = await hfTextToImage(prompt);
  return img || getPlaceholderPostImage(postText);
}

async function genStoryImage(user, storyText) {
  try {
    if (!IS_PROD) return await generateStoryImage(user, storyText);
  } catch (_) {}
  const prompt = `Instagram story style image for ${user.firstName}. Caption context: ${storyText}.`;
  const img = await hfTextToImage(prompt);
  return img || getPlaceholderStoryImage(storyText);
}

module.exports = { genProfileImage, genPostImage, genStoryImage };


