'use strict';

// TYPES
import { FastifyInstance } from 'fastify';
import { IRoutes } from 'interfaces/api';

// API > MIDDLEWARE
import mw from '../../middleware';
import mw_auth from '../../middleware/auth';

// API > SCHEMAS
import schemas from '../../schemas';

// CONFIG
import config from '../../../config';

function bind_blockchain_routes(server: FastifyInstance, options: any): FastifyInstance {
  // @ Route Options Area
  const routes: IRoutes = {
    get_whales: {
      method: 'GET',
      url: '/v1' + config.endpoints.blockchain_whales,
      schema: {
        querystring: {
          chain: { type: 'string' },
        },
      },
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials = {
          chain: request.query.chain,
        };

        try {
          const result = await options.services.blockchain.get_whales(credentials);

          reply.send(result);
        } catch (error) {
          reply.status(422).send(error);
        }
      },
    },
    get_upcoming_unlocks: {
      method: 'GET',
      url: '/v1' + config.endpoints.blockchain_upcoming_unlocks,
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials = {
          chain: request.query.chain,
        };

        try {
          const result = await options.services.blockchain.get_upcoming_unlocks(credentials);

          reply.send(result);
        } catch (error) {
          reply.status(422).send(error);
        }
      },
    },
    audit: {
      method: 'GET',
      url: '/v1' + config.endpoints.blockchain_audit,
      schema: {
        querystring: {
          chain_id: { type: 'string' },
        },
      },
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials = {
          address: request.params.token,
          chain_id: request.query.chain_id,
        };

        try {
          const result = await options.services.blockchain.audit(credentials);

          reply.send(result);
        } catch (error) {
          reply.status(422).send(error);
        }
      },
    },
    audits: {
      method: 'GET',
      url: '/v1' + config.endpoints.blockchain_audits,
      schema: {
        querystring: {
          limit: { type: config.types.string },
          latest: { type: config.types.string },
        },
      },
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials = {
          limit: request.query.limit,
          latest: request.query.latest,
        };

        try {
          const result = await options.services.blockchain.get_audits(credentials);

          reply.send(result);
        } catch (error) {
          reply.status(422).send(error);
        }
      },
    },
  };

  const allRoutes: any[] = Object.values(routes);

  for (let i = 0; i < allRoutes.length; i++) {
    server.route(allRoutes[i]);
  }

  return server;
}

export default bind_blockchain_routes;
