import 'dotenv/config';
import { createApp } from './app';
import { config } from './config';
import { connectDatabase } from './db/connection';

async function start() {
  // Connect to MongoDB first — the server should not start without it
  await connectDatabase();

  const app = createApp();

  app.listen(config.port, () => {
    console.log('[BrainCache] Server running on http://localhost:' + config.port);
    console.log('[BrainCache] Environment: ' + config.nodeEnv);
    console.log('[BrainCache] Health: http://localhost:' + config.port + '/api/health');
  });
}

start();