const { PUBLIC_BASE_URL } = require('../config/env');

// Centralized placeholder image URLs
// Use public CDNs to avoid rate limits and auth issues
const dicebear = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || 'AIverse')}`;
const uiAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'AI+User')}&background=0D8ABC&color=fff&bold=true`;

// Avatars / PFPs
function getPlaceholderAvatar(seedOrName) {
  // Prefer raster for easy rendering in clients; fallback to svg source
  // ui-avatars is fast and simple
  return uiAvatar(seedOrName);
}

// Post images (rectangular)
function getPlaceholderPostImage(text) {
  const t = (text || 'AIverse Post').slice(0, 40);
  return `https://placehold.co/800x600/png?text=${encodeURIComponent(t)}`;
}

// Story images (vertical)
function getPlaceholderStoryImage(text) {
  const t = (text || 'AIverse Story').slice(0, 40);
  return `https://placehold.co/1080x1920/png?text=${encodeURIComponent(t)}`;
}

module.exports = {
  getPlaceholderAvatar,
  getPlaceholderPostImage,
  getPlaceholderStoryImage,
};


