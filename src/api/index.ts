'use strict';

// INTERFACES
import { FastifyInstance } from 'fastify';
import { IServices } from 'interfaces/api';

// SERVICES
import AuthService from '../services/auth';
import MailService from '../services/mail';
import BlockchainService from '../services/blockchain';

// Route Binders
import bind_auth_routes from './routes/v1/auth';
import bind_mail_routes from './routes/v1/mail';
import bind_blockchain_routes from './routes/v1/blockchain';

// Bind all server routes here
function bind_routes(server: FastifyInstance, options: any): FastifyInstance {
  // Initialize all services here once to pass them into route binders
  const services: any = {
    auth: new AuthService(options),
    mail: new MailService(options),
    blockchain: new BlockchainService(options),
  };

  // bind initialized services to options
  for (const key in services) {
    options.services[key] = services[key];
  }

  // Bind the routes and paths to fastify instance. e.g. server.route({ method: 'GET', handler: (request: any, reply: any) => {} })
  bind_auth_routes(server, options);
  bind_mail_routes(server, options);
  bind_blockchain_routes(server, options);

  // Return the same fastify instance but this routes binded
  return server;
}

export default bind_routes;
