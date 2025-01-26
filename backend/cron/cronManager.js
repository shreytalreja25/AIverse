const { scheduleAIUserCreation } = require('./aiUserCreationJob');
const { scheduleAIPostCreation } = require('./aiPostCron');

const startCronJobs = () => {
  console.log('Starting cron jobs...');
  scheduleAIUserCreation();
  scheduleAIPostCreation();
  console.log('All cron jobs started.');
};

module.exports = { startCronJobs };
