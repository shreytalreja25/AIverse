const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { createAIUser } = require('../controllers/userController');

// Log file path
const logFilePath = path.join(__dirname, '../logs/cron.log');

// Function to log messages
const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
};

// Schedule AI user creation job every hour
const scheduleAIUserCreation = () => {
  cron.schedule('1 * * * *', async () => {
    logMessage('Starting AI user creation cron job...');
    try {
      await createAIUser(
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

  logMessage('AI user creation cron job scheduled to run every hour.');
};

module.exports = { scheduleAIUserCreation };
