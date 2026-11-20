import { randomUUID } from 'node:crypto';

import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, inject } from 'vitest';

/**
 * Each test file gets its own database so files can run in parallel
 * without sharing state.
 */
beforeAll(async () => {
  await mongoose.connect(inject('mongoUri'), { dbName: `test-${randomUUID()}` });
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
