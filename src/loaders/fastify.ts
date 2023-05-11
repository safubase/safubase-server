'use strict';

// MODULES
import Fastify, { FastifyInstance } from 'fastify';
import fastify_cookie from '@fastify/cookie';
import fastify_cors from '@fastify/cors';
import fastify_helmet from '@fastify/helmet';
import fastify_rate_limit from '@fastify/rate-limit';

// API
import bind_routes from '../api';

// CONFIG
import config from '../config';

async function load_fastify(options: any): Promise<FastifyInstance> {
  // FASTIFY SERVER INSTANCE CONFIGURATIONS
  const server: FastifyInstance = Fastify({
    maxParamLength: 256, // url param length
    trustProxy: true, // for NGINX
    bodyLimit: 2097152, // no data more than 2mb is allowed in one request
  });

  // fastify middleware plugin registrations
  if (config.env.NODE_ENV === 'production') {
    await server.register(fastify_cors, {
      origin: ['https://' + config.env.URL_UI, 'https://admin.' + config.env.URL_UI],
      credentials: true,
    });
  } else if (config.env.NODE_ENV === 'development') {
    await server.register(fastify_cors, {
      origin: ['https://' + config.env.URL_UI, 'https://admin.' + config.env.URL_UI, 'http://localhost:3000'],
      credentials: true,
    });
  }

  await server.register(fastify_helmet);
  await server.register(fastify_cookie, { secret: config.env.SESSION_SECRET, parseOptions: {} });
  await server.register(fastify_rate_limit, { max: 200, global: false, timeWindow: '1 minute' });

  bind_routes(server, options);

  // Inject server instance to dependencies object
  options.server = server;

  return server;
}

export default load_fastify;
