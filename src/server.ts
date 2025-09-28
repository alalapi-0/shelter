import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const start = async () => {
  const app = await buildApp();

  const closeApp = async (signal: NodeJS.Signals) => {
    logger.info({ signal }, 'Received shutdown signal');
    await app.close();
    process.exit(0);
  };

  const handleSignal = (signal: NodeJS.Signals) => {
    void closeApp(signal).catch((error) => {
      logger.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    });
  };

  process.on('SIGINT', handleSignal);
  process.on('SIGTERM', handleSignal);

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`Server listening on http://0.0.0.0:${env.PORT}`);
  } catch (error) {
    app.log.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

start();
