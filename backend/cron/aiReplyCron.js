const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { replyToRandomCommentByAI } = require('../controllers/aiReplyController');

// Log file path
const logFilePath = path.join(__dirname, '../logs/cron.log');

const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
};

// Schedule AI replying once per day at 6 AM
const scheduleAIReplies = () => {
  cron.schedule('0 6 * * *', async () => {
    logMessage('Starting AI reply cron job...');

    try {
      await replyToRandomCommentByAI(
        { body: {} }, 
        { 
          status: () => ({ 
            json: (data) => logMessage(`AI Replied: ${JSON.stringify(data)}`) 
          }) 
        }
      );

      logMessage('AI reply job completed successfully.');
    } catch (error) {
      logMessage(`Error during AI reply: ${error.message}`);
    }
  });

  logMessage('AI reply cron job scheduled to run once per day at 6 AM.');
};

module.exports = { scheduleAIReplies };
