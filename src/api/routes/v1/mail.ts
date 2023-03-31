'use strict';

// TYPES
import { FastifyInstance } from 'fastify';
import { IRoutes } from 'interfaces/api';

// API > MIDDLEWARE
import mws from '../../middleware';
import mws_auth from '../../middleware/auth';

// API > SCHEMAS
import schemas from '../../schemas';

// CONFIG
import config from '../../../config';

function bind_mail_routes(server: FastifyInstance, options: any): FastifyInstance {
  // @ Route Options Area
  const routes: IRoutes = {
    resend_email_verification_link: {
      method: 'POST',
      url: '/v1' + config.endpoints.mail_send_email_verification_link,
      schema: {
        response: {
          200: {
            type: config.types.object,
            properties: {
              success: { type: config.types.boolean },
              message: { type: config.types.string },
            },
          },
        },
      },
      preValidation: mws.prevalidation(mws_auth.is_auth, options),
      handler: async function (request: any, reply: any) {
        try {
          await options.services.mail.resend_verification_link(request.body.email);

          const response = {
            success: true,
            message: 'Successfully resent email verification link',
          };

          reply.send(response);
        } catch (error) {
          reply.status(422).send(error);
        }
      },
    },

    send_password_reset_link: {
      method: 'POST',
      url: '/v1' + config.endpoints.mail_send_password_reset_link,
      schema: {
        response: {
          200: schemas.user,
        },
      },
      preValidation: mws.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        try {
          await options.services.mail.send_password_reset_link(request.body.email);

          const response = {
            success: true,
            message: 'Successfully sent password reset link',
          };

          reply.send(response);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    send_email_reset_link: {
      method: 'POST',
      url: '/v1' + config.endpoints.mail_send_email_reset_link,
      schema: {
        response: {
          200: schemas.user,
        },
      },
      preValidation: mws.prevalidation(mws_auth.is_auth, options),
      handler: async function (request: any, reply: any) {
        const credentials = {
          ...request.body,
          user: request.user,
        };

        try {
          await options.services.mail.send_email_reset_link(credentials);

          const response = {
            success: true,
            message: 'Successfully sent email reset link',
          };

          reply.send(response);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    add_subscription_email: {
      method: 'POST',
      url: '/v1' + config.endpoints.mail_subscription_emails,
      preValidation: mws.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials = {
          ...request.body,
        };

        try {
          await options.services.mail.add_subscription_email(credentials);

          const response = {
            success: true,
            message: 'Successfully subscribed with email',
          };

          reply.send(response);
        } catch (err: any) {
          reply.status(422).send(err);
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

export default bind_mail_routes;
