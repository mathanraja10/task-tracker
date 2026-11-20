import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

export async function connectDatabase(uri: string): Promise<void> {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.info(`[db] Connected to MongoDB (${mongoose.connection.name})`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.info('[db] Disconnected from MongoDB');
}
