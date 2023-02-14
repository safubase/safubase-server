'use strict';

// INTERFACES
import { FastifyInstance } from 'fastify';
import { IServices } from 'interfaces/api';

// SERVICES
import AuthService from '../services/auth';
import MailService from '../services/mail';

// Route Binders
import bind_auth_routes from './routes/v1/auth';
import bind_mail_routes from './routes/v1/mail';

// Bind all serve routes here
function bind_routes(server: FastifyInstance, options: any): FastifyInstance {
  // Initialize all services here once to pass them into route binders
  const services: IServices = {
    auth: new AuthService(options),
    mail: new MailService(options),
  };

  // Bind the routes and paths to fastify instance. e.g. server.route({ method: 'GET', handler: (request: any, reply: any) => {} })
  bind_auth_routes(server, services, options);
  bind_mail_routes(server, services, options);

  // Return the same fastify instance but this routes binded
  return server;
}

export default bind_routes;
