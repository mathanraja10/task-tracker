/**
 * Seeds the database with sample tasks.
 *
 *   npm run seed            # only seeds an empty collection
 *   npm run seed -- --reset # deletes ALL existing tasks first
 */
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { TaskModel } from '../models/task.model.js';
import { createTaskSchema } from '../validations/task.validation.js';

import { SEED_TASKS } from './seed-data.js';

async function seed(): Promise<void> {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed: NODE_ENV is "production".');
  }

  const reset = process.argv.includes('--reset');

  // Same rules as the API, so seed data can never violate the contract.
  const tasks = SEED_TASKS.map((task) => createTaskSchema.parse(task));

  await connectDatabase(env.MONGODB_URI);

  const existing = await TaskModel.countDocuments();
  if (existing > 0 && !reset) {
    console.info(
      `[seed] Skipped: ${existing} task(s) already exist. Re-run with "npm run seed -- --reset" to replace them.`,
    );
    return;
  }

  if (reset) {
    const { deletedCount } = await TaskModel.deleteMany({});
    console.info(`[seed] Removed ${deletedCount} existing task(s).`);
  }

  // Insert sequentially so createdAt reflects list order (newest last).
  for (const task of tasks) {
    await TaskModel.create(task);
  }
  console.info(`[seed] Inserted ${tasks.length} sample tasks.`);
}

seed()
  .catch((error: unknown) => {
    console.error('[seed] Failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
