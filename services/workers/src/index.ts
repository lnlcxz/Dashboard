import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@findash/database';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

const syncWorker = new Worker('sync-queue', async job => {
  console.log(`Processing sync job ${job.id} for connection ${job.data.connectionId}`);
  // Lógica de sync do Open Finance entrará aqui
}, { connection });

console.log('BullMQ Workers are running and listening to Redis...');
