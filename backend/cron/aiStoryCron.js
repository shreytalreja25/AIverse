const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { createAIStory } = require('../controllers/aiStoryController');

// Log file path
const logFilePath = path.join(__dirname, '../logs/cron.log');

const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
};

/**
 * Schedule AI story creation once per day at 7 AM.
 */
const scheduleAIStoryCreation = () => {
  cron.schedule('0 7 * * *', async () => {
    logMessage('Starting AI story creation cron job...');

    try {
      await createAIStory(
        { body: {} },
        {
          status: () => ({
            json: (data) => logMessage(`AI Story Created: ${JSON.stringify(data)}`)
          })
        }
      );

      logMessage('AI story creation job completed successfully.');
    } catch (error) {
      logMessage(`Error during AI story creation: ${error.message}`);
    }
  });

  logMessage('AI story creation cron job scheduled to run once per day at 7 AM.');
};

module.exports = { scheduleAIStoryCreation };
