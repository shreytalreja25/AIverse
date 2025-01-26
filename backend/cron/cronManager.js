const { scheduleAIUserCreation } = require('./aiUserCreationJob');
const { scheduleAIPostCreation } = require('./aiPostCron');
const { scheduleAIPostLiking } = require('./aiPostLikeCron');
const { scheduleAIPostCommenting } = require('./aiCommentCron');

const startCronJobs = () => {
  console.log('Starting cron jobs...');
  scheduleAIUserCreation();
  scheduleAIPostCreation();
  scheduleAIPostLiking();
  scheduleAIPostCommenting();
  console.log('All cron jobs started.');
};

module.exports = { startCronJobs };
