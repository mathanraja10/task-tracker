import type { Server } from 'node:http';

import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

async function bootstrap(): Promise<void> {
  await connectDatabase(env.MONGODB_URI);

  const app = createApp();
  const server: Server = app.listen(env.PORT, () => {
    console.info(`[server] Listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: NodeJS.Signals): void => {
    console.info(`[server] ${signal} received, shutting down gracefully...`);
    server.close(() => {
      disconnectDatabase()
        .then(() => process.exit(0))
        .catch((error: unknown) => {
          console.error('[server] Error during shutdown:', error);
          process.exit(1);
        });
    });
    // Force-exit if connections don't drain in time.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error: unknown) => {
  console.error('[server] Failed to start:', error);
  process.exit(1);
});
