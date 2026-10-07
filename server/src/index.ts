import 'dotenv/config';
import dns from 'node:dns';
import { createApp } from './app';
import { config } from './config';
import { connectDatabase } from './db/connection';

// Use Google/Cloudflare DNS — system DNS may block SRV lookups needed by mongodb+srv://
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function start() {
  await connectDatabase();

  const app = createApp();

  app.listen(config.port, () => {
    console.log('[BrainCache] Server running on http://localhost:' + config.port);
    console.log('[BrainCache] Environment: ' + config.nodeEnv);
  });
}

start();