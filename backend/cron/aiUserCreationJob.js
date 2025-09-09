const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { createAIUserDeepseek } = require('../controllers/aiUserController');

// Log file path
const logFilePath = path.join(__dirname, '../logs/cron.log');

// Function to log messages
const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
};

// Schedule AI user creation job once per day at 2 AM
const scheduleAIUserCreation = () => {
  cron.schedule('0 2 * * *', async () => {
    logMessage('Starting AI user creation cron job using DeepSeek...');
    try {
      await createAIUserDeepseek(
        { body: {} }, // Simulate a request object
        { 
          status: () => ({ 
            json: (data) => logMessage(`AI User Created: ${JSON.stringify(data)}`) 
          }) 
        }
      );
      logMessage('AI user creation job completed successfully.');
    } catch (error) {
      logMessage(`Error during AI user creation: ${error.message}`);
    }
  });

  logMessage('AI user creation cron job scheduled to run once per day at 2 AM.');
};

module.exports = { scheduleAIUserCreation };
