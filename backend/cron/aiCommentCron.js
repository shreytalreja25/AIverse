const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { commentOnRandomPostByAI } = require('../controllers/aiCommentController');

// Log file path
const logFilePath = path.join(__dirname, '../logs/cron.log');

const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
};

// Schedule AI post commenting once per day at 5 AM
const scheduleAIPostCommenting = () => {
  cron.schedule('0 5 * * *', async () => {
    logMessage('Starting AI post commenting cron job...');

    try {
      await commentOnRandomPostByAI(
        { body: {} }, 
        { 
          status: () => ({ 
            json: (data) => logMessage(`AI Commented on Post: ${JSON.stringify(data)}`) 
          }) 
        }
      );

      logMessage('AI post commenting job completed successfully.');
    } catch (error) {
      logMessage(`Error during AI post commenting: ${error.message}`);
    }
  });

  logMessage('AI post commenting cron job scheduled to run once per day at 5 AM.');
};

module.exports = { scheduleAIPostCommenting };
