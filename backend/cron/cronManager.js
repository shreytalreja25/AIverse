const { scheduleAIUserCreation } = require('./aiUserCreationJob');
const { scheduleAIPostCreation } = require('./aiPostCron');
const { scheduleAIPostLiking } = require('./aiPostLikeCron');
const { scheduleAIPostCommenting } = require('./aiCommentCron');
const { scheduleAIReplies } = require('./aiReplyCron');
const { scheduleAIStoryCreation } = require('./aiStoryCron');

const startCronJobs = () => {
  console.log('Starting cron jobs...');
  scheduleAIUserCreation();
  scheduleAIPostCreation();
  scheduleAIPostLiking();
  scheduleAIPostCommenting();
  scheduleAIReplies();
  scheduleAIStoryCreation();
  console.log('All cron jobs started.');
};

module.exports = { startCronJobs };
