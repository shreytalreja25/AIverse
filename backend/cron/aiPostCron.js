const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { createAIPost,createAIPostWithImage } = require('../controllers/aiPostController');

// Log file path
const logFilePath = path.join(__dirname, '../logs/cron.log');

// Function to log messages to a file
const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
};

// Schedule AI post creation every minute
const scheduleAIPostCreation = () => {
  cron.schedule('* * * * *', async () => {
    logMessage('Starting AI post creation cron job...');

    try {
      // Simulating a request object and response for API call
      await createAIPostWithImage(
        { body: {} },
        {
          status: () => ({
            json: (data) => logMessage(`AI Post Created: ${JSON.stringify(data)}`)
          })
        }
      );

      logMessage('AI post creation job completed successfully.');
    } catch (error) {
      logMessage(`Error during AI post creation: ${error.message}`);
    }
  });

  logMessage('AI post creation cron job scheduled to run every minute.');
};

module.exports = { scheduleAIPostCreation };
