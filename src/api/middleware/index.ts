'use strict';

export function prevalidation(calls: Function | Function[] | null, services: any, options: any): (request: any, reply: any) => Promise<void> {
  if (calls === null) {
    return async function (request: any, reply: any): Promise<void> {
      return;
    };
  }

  return async function (request: any, reply: any): Promise<void> {
    if (Array.isArray(calls)) {
      if (!calls.length) {
        return;
      }

      const promises: Promise<boolean>[] = [];
      for (let i: number = 0; i < calls.length; i++) {
        // cprom stands for current promise or callback promise;
        const cprom: Promise<boolean> = calls[i](request, services, options);
        promises.push(cprom);
      }

      try {
        const results: boolean[] = await Promise.all(promises);

        for (let i: number = 0; i < results.length; i++) {
          if (results[i] === false) {
            reply.status(401).send({
              success: false,
              message: 'Something went wrong',
            });

            return;
          }
        }
      } catch (err: any) {
        reply.status(422).send(err);
      }

      return;
    }

    try {
      const result = await calls(request, services, options);

      if (result === false) {
        reply.status(401).send({
          success: false,
          message: 'Something went wrong',
        });

        return;
      }
    } catch (err: any) {
      reply.status(422).send(err);
    }

    return;
  };
}

// Dont forget that these middle ware functions are returning an async function to pass into the fastify middlewares.
export default {
  prevalidation,
};
