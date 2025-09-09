import api from '../utils/apiClient';

// Posts API
export const postsAPI = {
  // Get all posts with pagination
  getPosts: (page = 1, limit = 10) => 
    api.get('/api/posts', { params: { page, limit } }),

  // Get single post by ID
  getPost: (id) => 
    api.get(`/api/posts/${id}`),

  // Get posts by user ID
  getUserPosts: (userId) => 
    api.get(`/api/posts/user/${userId}`),

  // Get similar posts
  getSimilarPosts: (postId) => 
    api.get(`/api/posts/similar/${postId}`),

  // Like a post
  likePost: (postId) => 
    api.post(`/api/posts/${postId}/like`),

  // Unlike a post
  unlikePost: (postId) => 
    api.delete(`/api/posts/${postId}/like`),

  // Add comment to post
  addComment: (postId, text) => 
    api.post(`/api/posts/${postId}/comment`, { text }),

  // Create new post
  createPost: (postData) => 
    api.post('/api/posts', postData),

  // Update post
  updatePost: (postId, postData) => 
    api.put(`/api/posts/${postId}`, postData),

  // Delete post
  deletePost: (postId) => 
    api.delete(`/api/posts/${postId}`)
};

// Users API
export const usersAPI = {
  // Get user profile
  getProfile: (userId) => 
    api.get(`/api/profile/${userId}`),

  // Update user profile
  updateProfile: (userId, profileData) => 
    api.put(`/api/profile/${userId}`, profileData),

  // Follow user
  followUser: (userId) => 
    api.post(`/api/users/${userId}/follow`),

  // Unfollow user
  unfollowUser: (userId) => 
    api.post(`/api/users/${userId}/unfollow`),

  // Get suggested users
  getSuggestedUsers: () => 
    api.get('/api/suggested-users'),

  // Search users
  searchUsers: (query) => 
    api.get('/api/search/users', { params: { q: query } })
};

// Auth API
export const authAPI = {
  // Login
  login: (credentials) => 
    api.post('/api/auth/login', credentials),

  // Register
  register: (userData) => 
    api.post('/api/auth/register', userData),

  // Logout
  logout: () => 
    api.post('/api/auth/logout'),

  // Get current user
  getCurrentUser: () => 
    api.get('/api/auth/me'),

  // Refresh token
  refreshToken: () => 
    api.post('/api/auth/refresh')
};

// Stories API
export const storiesAPI = {
  // Get all stories
  getStories: () => 
    api.get('/api/stories'),

  // Get user stories
  getUserStories: (userId) => 
    api.get(`/api/stories/user/${userId}`),

  // Create story
  createStory: (storyData) => 
    api.post('/api/stories', storyData),

  // Delete story
  deleteStory: (storyId) => 
    api.delete(`/api/stories/${storyId}`)
};

// Search API
export const searchAPI = {
  // Search posts
  searchPosts: (query, page = 1, limit = 10) => 
    api.get('/api/search/posts', { params: { q: query, page, limit } }),

  // Search users
  searchUsers: (query, page = 1, limit = 10) => 
    api.get('/api/search/users', { params: { q: query, page, limit } }),

  // Search all
  searchAll: (query, page = 1, limit = 10) => 
    api.get('/api/search', { params: { q: query, page, limit } })
};

// Notifications API
export const notificationsAPI = {
  // Get notifications
  getNotifications: () => 
    api.get('/api/notifications'),

  // Mark notification as read
  markAsRead: (notificationId) => 
    api.put(`/api/notifications/${notificationId}/read`),

  // Mark all as read
  markAllAsRead: () => 
    api.put('/api/notifications/read-all'),

  // Delete notification
  deleteNotification: (notificationId) => 
    api.delete(`/api/notifications/${notificationId}`)
};

// Activities API
export const activitiesAPI = {
  // Get user activities
  getActivities: (page = 1, limit = 20) => 
    api.get('/api/activities', { params: { page, limit } }),

  // Get activity by ID
  getActivity: (activityId) => 
    api.get(`/api/activities/${activityId}`)
};

export default {
  posts: postsAPI,
  users: usersAPI,
  auth: authAPI,
  stories: storiesAPI,
  search: searchAPI,
  notifications: notificationsAPI,
  activities: activitiesAPI
};
