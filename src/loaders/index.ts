'use strict';

// INTERFACES
import { FastifyInstance } from 'fastify';
import IOptions from 'interfaces/common';

// CONFIG
import config from '../config';

// LOADERS
import load_fastify from './fastify';
import load_logger from './logger';
import load_mongodb from './mongodb';
import load_cron from './cron';
import load_redis from './redis';

async function load_server(): Promise<FastifyInstance> {
  // Dependency injections, you will carry that object throughout the whole program
  const options: IOptions = {
    db: {},
    collections: {},
    redis: {},
    services: {},
  };

  // LOADING COMPONENTS order has to be => 1. logger and redis functions 2. mongodb configurations 3. cron jobs initializations and fastify route bindings

  // First load logger and redis functions
  const logger = load_logger(options);
  logger.info('Logger loaded...');

  await load_redis(options);
  logger.info('Redis loaded...');

  // configure mongodb
  await load_mongodb(config.env.DB_CONN_STR, options);
  logger.info('Mongodb loaded...');

  // Then initialize cron jobs and bind routes to fastify with the given configured mongodb object; options.collections or options.db
  await load_cron(options);
  logger.info('Cron jobs loaded...');

  // We get the mongo client to pass in the fastify application loader to use in the routes
  // Load the Fastify App with the configured mongo client.
  const server: FastifyInstance = await load_fastify(options);
  logger.info('Fastify loaded...');

  return server;
}

export default load_server;
