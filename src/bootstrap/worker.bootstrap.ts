import { NestFactory } from '@nestjs/core';
import { Queues } from '../constants/queue.constants';
import { WORKER_MODULES } from '../constants/worker.module';

export async function bootstrapWorker() {
  const queueKey = process.env.QUEUE as keyof typeof Queues;

  const queueName = Queues[queueKey];

  if (!queueName) {
    throw new Error(
      `QUEUE INVALID OR NOT PROVIDED: ${queueKey}`
    );
  }

  const WorkerModule = WORKER_MODULES[queueKey];

  if (!WorkerModule) {
    throw new Error(
      `MODULE NOT FOUND FOR ${queueKey} QUEUE`
    );
  }

  await NestFactory.createApplicationContext(WorkerModule);

  console.log(`QUEUE "${queueName}" STARTED `);
}