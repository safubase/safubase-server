'use strict';

// MODULES
import { createClient } from 'redis';

async function load_redis(options: any) {
  const client = createClient();

  client.on('error', (err: any) => {
    throw new Error(err);
  });

  await client.connect();

  options.redis = client;

  return client;
}

export default load_redis;
