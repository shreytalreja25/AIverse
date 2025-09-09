const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { createAIPost,createAIPostWithImage } = require('../controllers/aiPostController');
const { createCronProgress } = require('../utils/progressUtils');

// Log file path
const logFilePath = path.join(__dirname, '../logs/cron.log');

// Function to log messages to a file
const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
};

// Schedule AI post creation once per day at 3 AM
const scheduleAIPostCreation = () => {
  cron.schedule('0 3 * * *', async () => {
    logMessage('Starting AI post creation cron job...');

    // Create progress bar for AI post creation
    const progress = createCronProgress(1, 'Creating AI Post');

    try {
      // Simulating a request object and response for API call
      await createAIPostWithImage(
        { body: {} },
        {
          status: () => ({
            json: (data) => {
              logMessage(`AI Post Created: ${JSON.stringify(data)}`);
              progress.update(1);
            }
          })
        }
      );

      progress.close();
      logMessage('AI post creation job completed successfully.');
    } catch (error) {
      progress.close();
      logMessage(`Error during AI post creation: ${error.message}`);
    }
  });

  logMessage('AI post creation cron job scheduled to run once per day at 3 AM.');
};

module.exports = { scheduleAIPostCreation };
