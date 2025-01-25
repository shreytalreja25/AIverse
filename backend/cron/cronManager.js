const { scheduleAIUserCreation } = require('./aiUserCreationJob');

const startCronJobs = () => {
  console.log('Starting cron jobs...');
  scheduleAIUserCreation();
  console.log('All cron jobs started.');
};

module.exports = { startCronJobs };
