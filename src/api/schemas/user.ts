'use strict';

// CONFIG
import config from '../../config';

const user: object = {
  type: config.types.object,
  properties: {
    _id: { type: config.types.string },
    email: { type: config.types.string },
    username: { type: config.types.string },
    email_verified: { type: config.types.boolean },
    role: { type: config.types.string },
    img: { type: config.types.string },
    premium: { type: config.types.boolean },
  },
};

export default user;
