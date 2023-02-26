'use strict';

// INTERFACES
import { Document } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { IRoutes } from 'interfaces/api';

// API > MIDDLEWARE
import mws from '../../middleware';
import mw_auth from '../../middleware/auth';

// API > SCHEMAS
import schemas from '../../schemas';

// CONFIG
import config from '../../../config';

function bind_auth_routes(server: FastifyInstance, options: any): FastifyInstance {
  // @ Route Options Area
  const routes: IRoutes = {
    // #title: GET PROFILE
    // #state: Public
    // #desc: Check if request has session and user, response: IProfile | null
    get_profile: {
      method: 'GET',
      url: '/v1' + config.endpoints.profile,
      preValidation: mws.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          sid: request.cookies[config.env.SESSION_NAME],
          ip: request.ip,
        };

        try {
          const profile = await options.services.auth.get_profile(credentials);

          reply.send(profile);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    // #title: EDIT PROFILE
    // #state: Private
    // #desc: Allow signed in user to edit its profile credentials.
    edit_profile: {
      method: 'PUT',
      url: '/v1' + config.endpoints.profile,
      schema: {
        response: {
          200: schemas.user,
        },
      },
      preValidation: mws.prevalidation(mw_auth.is_auth, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.body, user: request.user };

        try {
          const result = await options.services.auth.edit_profile(credentials);

          reply.send(result);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    // #title: SIGNUP
    // #state: Public
    // #desc: Signs the user to the database if their credentials is valid and give them a session id.
    signup: {
      method: 'POST',
      url: '/v1' + config.endpoints.signup,
      schema: {
        response: {
          200: schemas.user,
        },
      },
      preValidation: mws.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials = {
          ...request.body,
          ip: request.ip,
        };

        try {
          const result = await options.services.auth.signup(credentials);

          // Sending confirmation mail to those who just signed up
          await options.services.mail.send_verification_link({
            email: result.user.email,
            token: result.email_verification_token,
          });

          reply
            .setCookie(config.env.SESSION_NAME, result.sid, {
              httpOnly: true,
              secure: true,
              host: config.env.URL_UI,
              path: '/',
            })
            .send(result.user);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    // #title: SIGNIN
    // #state: Public
    // #desc: Sign users in and give them a session id.
    signin: {
      method: 'POST',
      url: '/v1' + config.endpoints.signin,
      schema: {
        response: {
          200: schemas.user,
        },
      },
      preValidation: mws.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials = {
          ...request.body,
          ip: request.ip,
        };

        try {
          const result = await options.services.auth.signin(credentials);

          reply
            .setCookie(config.env.SESSION_NAME, result.sid, {
              httpOnly: true,
              secure: true,
              host: config.env.URL_UI,
              path: '/',
            })
            .send(result.user);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    // #title: SIGNOUT
    // #state: Private
    // #desc: Sign users out and remove their session id.
    signout: {
      method: 'GET',
      url: '/v1' + config.endpoints.signout,
      preValidation: mws.prevalidation(mw_auth.is_auth, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          sid: request.cookies[config.env.SESSION_NAME],
          user: request.user,
        };

        try {
          await options.services.auth.signout(credentials);

          reply
            .setCookie(config.env.SESSION_NAME, null, {
              path: '/',
            })
            .send(true);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    // #title: RESET PASSWORD
    // #state: Public
    // #desc: Resets users password by sending token to the user with the specified email.
    reset_password: {
      method: 'POST',
      url: '/v1' + config.endpoints.reset_password,
      schema: {
        response: {
          200: schemas.user,
        },
      },
      preValidation: mws.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials = {
          ...request.body,
          token: request.params.token,
        };

        try {
          const user = await options.services.auth.reset_password(credentials);

          reply.send(user);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    // #title: CHANGE PASSWORD
    // #state: Private
    // #desc: Changes users password with authentication
    change_password: {
      method: 'POST',
      url: '/v1' + config.endpoints.change_password,
      schema: {
        response: {
          200: schemas.user,
        },
      },
      preValidation: mws.prevalidation(mw_auth.is_auth, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,
          user: request.user,
        };

        try {
          const user = await options.services.auth.change_password(credentials);

          reply.send(user);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    // #title: RESET EMAIL
    // #state: Private
    // #desc: Sends a link to the users new email, after click the link in the new email it resets and make that email the new one .
    reset_email: {
      method: 'POST',
      url: '/v1' + config.endpoints.reset_email,
      schema: {
        response: {
          200: schemas.user,
        },
      },
      preValidation: mws.prevalidation(mw_auth.is_auth, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,
          user: request.user,
        };

        try {
          const user = await options.services.auth.reset_email(credentials);

          reply.send(user);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    // #title: VERIFY EMAIL
    // #state: Private
    // #desc: Verifies user's email by sending token to the specified email
    verify_email: {
      method: 'GET',
      url: '/v1' + config.endpoints.verify_email,
      preValidation: mws.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        try {
          const user = await options.services.auth.verify_email(request.params.token);

          reply.send(user);
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

export default bind_auth_routes;
