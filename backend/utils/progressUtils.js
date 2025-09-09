const cliProgress = require('cli-progress');

/**
 * Progress utility functions for backend operations
 */

/**
 * Create a progress bar for database operations
 * @param {number} total - Total number of items to process
 * @param {string} description - Description of the operation
 * @returns {Object} Progress bar instance
 */
const createDatabaseProgress = (total, description = 'Processing') => {
  const progress = new cliProgress.SingleBar({
    format: `🗄️  ${description} |{bar}| {percentage}% | {value}/{total} items | ETA: {eta}s`,
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);
  
  progress.start(total, 0);
  return progress;
};

/**
 * Create a progress bar for AI operations
 * @param {number} total - Total number of items to process
 * @param {string} description - Description of the operation
 * @returns {Object} Progress bar instance
 */
const createAIProgress = (total, description = 'AI Processing') => {
  const progress = new cliProgress.SingleBar({
    format: `🤖 ${description} |{bar}| {percentage}% | {value}/{total} items | ETA: {eta}s`,
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);
  
  progress.start(total, 0);
  return progress;
};

/**
 * Create a progress bar for file operations
 * @param {number} total - Total number of items to process
 * @param {string} description - Description of the operation
 * @returns {Object} Progress bar instance
 */
const createFileProgress = (total, description = 'File Processing') => {
  const progress = new cliProgress.SingleBar({
    format: `📁 ${description} |{bar}| {percentage}% | {value}/{total} files | ETA: {eta}s`,
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);
  
  progress.start(total, 0);
  return progress;
};

/**
 * Create a progress bar for server startup
 * @param {number} total - Total number of steps
 * @param {string} description - Description of the operation
 * @returns {Object} Progress bar instance
 */
const createStartupProgress = (total, description = 'Server Startup') => {
  const progress = new cliProgress.SingleBar({
    format: `🚀 ${description} |{bar}| {percentage}% | {value}/{total} steps | ETA: {eta}s`,
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);
  
  progress.start(total, 0);
  return progress;
};

/**
 * Create a progress bar for cron jobs
 * @param {number} total - Total number of items to process
 * @param {string} description - Description of the operation
 * @returns {Object} Progress bar instance
 */
const createCronProgress = (total, description = 'Cron Job') => {
  const progress = new cliProgress.SingleBar({
    format: `⏰ ${description} |{bar}| {percentage}% | {value}/{total} items | ETA: {eta}s`,
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);
  
  progress.start(total, 0);
  return progress;
};

/**
 * Create a progress bar for API operations
 * @param {number} total - Total number of items to process
 * @param {string} description - Description of the operation
 * @returns {Object} Progress bar instance
 */
const createAPIProgress = (total, description = 'API Processing') => {
  const progress = new cliProgress.SingleBar({
    format: `🌐 ${description} |{bar}| {percentage}% | {value}/{total} requests | ETA: {eta}s`,
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);
  
  progress.start(total, 0);
  return progress;
};

/**
 * Simulate progress for async operations with steps
 * @param {Array} steps - Array of step descriptions
 * @param {Function} stepFunction - Function to execute for each step
 * @param {string} description - Overall description
 */
const simulateProgress = async (steps, stepFunction, description = 'Processing') => {
  const progress = createStartupProgress(steps.length, description);
  
  for (let i = 0; i < steps.length; i++) {
    try {
      await stepFunction(steps[i], i);
      progress.update(1);
    } catch (error) {
      console.error(`❌ Error in step ${i + 1}: ${error.message}`);
      progress.update(1);
    }
  }
  
  progress.close();
};

/**
 * Create a simple progress indicator for single operations
 * @param {string} message - Message to display
 * @param {Function} operation - Operation to perform
 */
const withProgress = async (message, operation) => {
  const progress = new cliProgress.SingleBar({
    format: `⏳ ${message} |{bar}| {percentage}% | ETA: {eta}s`,
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);
  
  progress.start(1, 0);
  
  try {
    const result = await operation();
    progress.update(1);
    progress.stop();
    return result;
  } catch (error) {
    progress.stop();
    throw error;
  }
};

module.exports = {
  createDatabaseProgress,
  createAIProgress,
  createFileProgress,
  createStartupProgress,
  createCronProgress,
  createAPIProgress,
  simulateProgress,
  withProgress
};
