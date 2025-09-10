/**
 * Image compression utility functions
 */

/**
 * Compress an image file to reduce its size
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width in pixels (default: 1920)
 * @param {number} maxHeight - Maximum height in pixels (default: 1080)
 * @param {number} quality - Compression quality 0-1 (default: 0.8)
 * @returns {Promise<string>} - Compressed image as base64 data URL
 */
export const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validate image file before processing
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum file size in MB (default: 10)
 * @returns {Object} - { isValid: boolean, error?: string }
 */
export const validateImageFile = (file, maxSizeMB = 10) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Please select a valid image file' };
  }
  
  // Check file size
  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `Image file is too large. Please select an image smaller than ${maxSizeMB}MB` 
    };
  }
  
  return { isValid: true };
};

/**
 * Get file size in a human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Calculate approximate base64 size from data URL
 * @param {string} dataUrl - Base64 data URL
 * @returns {number} - Approximate size in bytes
 */
export const getBase64Size = (dataUrl) => {
  // Base64 encoding increases size by ~33%, so we divide by 1.33 to get approximate original size
  return Math.round((dataUrl.length * 0.75));
};
