const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { likeRandomPostByAI } = require('../controllers/aiLikeController');

// Log file path
const logFilePath = path.join(__dirname, '../logs/cron.log');

// Function to log messages
const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
};

// Schedule AI post liking once per day at 4 AM
const scheduleAIPostLiking = () => {
  cron.schedule('0 4 * * *', async () => {
    logMessage('Starting AI post liking cron job...');

    try {
      await likeRandomPostByAI(
        { body: {} }, 
        { 
          status: () => ({ 
            json: (data) => logMessage(`AI Liked Post: ${JSON.stringify(data)}`) 
          }) 
        }
      );

      logMessage('AI post liking job completed successfully.');
    } catch (error) {
      logMessage(`Error during AI post liking: ${error.message}`);
    }
  });

  logMessage('AI post liking cron job scheduled to run once per day at 4 AM.');
};

module.exports = { scheduleAIPostLiking };
