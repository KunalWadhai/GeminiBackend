const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { Message } = require('../models');
const geminiService = require('./gemini.service');

// || 'redis://localhost:6379'
const redisConnection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

const geminiQueue = new Queue('gemini-queue', {
  connection: redisConnection
});

const addGeminiJob = async (data) => {
  await geminiQueue.add('process-message', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
};

// Worker to process Gemini jobs
const worker = new Worker('gemini-queue', async (job) => {
  console.log("Job Data", job.data);  // as on console we are getting this data, all set
  if (!job.data || !job.data.messageId || !job.data.message) {
    throw new Error('Invalid job data: missing messageId or message');
  }

  const { messageId, message } = job.data;

  try {
    const AIresponse = await geminiService.generateResponse(message);

    await Message.update(
      { response: AIresponse },
      { where: { id: messageId } }
    );

    console.log(`Processed message ${messageId}`);
  } catch (error) {
    console.error(`Failed to process message ${messageId}:`, error);
    throw error;
  }
}, {
  connection: redisConnection
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

module.exports = {
  addGeminiJob
};
