'use strict';

// ENTRY POINT OF THE PROGRAM.

// INTERFACES
import { FastifyInstance } from 'fastify';
import IOptions from 'interfaces/common';

// CONFIG
import config from './config';

// LOADERS
import load_server from './loaders';

async function init(): Promise<void> {
  // Specify port and host for fastify
  const port: number = Number(config.env.PORT);
  const host: string = config.env.HOST;

  // load_ferver returns a fastify instance with configured routes as well as mongodb database
  const server: FastifyInstance = await load_server();
  await server.listen({ port, host });

  console.log(`🛡️ Server listening on port: ${port} 🛡️`);
}

init();
