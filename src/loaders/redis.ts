'use strict';

// MODULES
import { createClient } from 'redis';

async function load_redis(options: any) {
  const client = createClient();

  client.on('error', (err: any) => {
    throw err;
  });

  await client.connect();
  await client.hSet('settings', 'test', '1');

  options.redis = client;

  return client;
}

export default load_redis;
