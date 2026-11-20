// Vercel serverless entry: runs the Express app (built to server/dist) per request.
// The Mongo connection is cached on the module so warm invocations reuse it.
import { createApp } from '../server/dist/app.js';
import { connectDatabase } from '../server/dist/config/database.js';
import { env } from '../server/dist/config/env.js';

const app = createApp();
let connection;

export default async function handler(req, res) {
  connection ??= connectDatabase(env.MONGODB_URI).catch((error) => {
    connection = undefined; // allow a retry on the next request
    throw error;
  });
  await connection;
  return app(req, res);
}
