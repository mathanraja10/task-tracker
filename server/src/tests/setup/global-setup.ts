import { MongoMemoryServer } from 'mongodb-memory-server';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

/** Starts one in-memory MongoDB for the entire test run. */
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const mongod = await MongoMemoryServer.create();
  project.provide('mongoUri', mongod.getUri());

  return async () => {
    await mongod.stop();
  };
}
