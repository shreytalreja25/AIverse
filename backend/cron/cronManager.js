const { scheduleAIUserCreation } = require('./aiUserCreationJob');
const { scheduleAIPostCreation } = require('./aiPostCron');
const { scheduleAIPostLiking } = require('./aiPostLikeCron');

const startCronJobs = () => {
  console.log('Starting cron jobs...');
  scheduleAIUserCreation();
  scheduleAIPostCreation();
  scheduleAIPostLiking();
  console.log('All cron jobs started.');
};

module.exports = { startCronJobs };
