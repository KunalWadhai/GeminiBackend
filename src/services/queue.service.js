const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { Message } = require('../models');
const geminiService = require('./gemini.service');

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

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
  const { messageId, message } = job.data;

  try {
    const response = await geminiService.generateResponse(message);

    await Message.update(
      { response },
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
