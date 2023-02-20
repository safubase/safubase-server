'use strict';

// MODULES
import Fastify, { FastifyInstance } from 'fastify';
import fastifyCookie, { FastifyCookieOptions } from '@fastify/cookie';
import fastifyCors, { FastifyCorsOptions } from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';

// API
import bind_routes from '../api';

// CONFIG
import config from '../config';

async function load_fastify(options: any): Promise<FastifyInstance> {
  // FASTIFY SERVER INSTANCE CONFIGURATIONS
  const server: FastifyInstance = Fastify({
    maxParamLength: 256, // url param length
    trustProxy: true, // for NGINX
    bodyLimit: 2097152, // no data more than 2mb is allowed in one req
  });

  const cookieOptions: FastifyCookieOptions = {
    secret: config.env.SESSION_SECRET,
    parseOptions: {},
  };

  const corsOptions: FastifyCorsOptions = {
    origin: ['https://' + config.env.URL_UI, 'https://admin.' + config.env.URL_UI],
    credentials: true,
  };

  // fastify middleware plugin registrations
  await server.register(fastifyHelmet);
  await server.register(fastifyCookie, cookieOptions);

  if (config.env.NODE_ENV === 'production') {
    await server.register(fastifyCors, corsOptions);
  }

  await server.register(fastifyRateLimit, { max: 200, global: false, timeWindow: '1 minute' });

  bind_routes(server, options);

  return server;
}

export default load_fastify;
