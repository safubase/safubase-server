'use strict';

// CONFIG
import config from '../../config';

const types = config.types;

const user: object = {
  type: types.object,
  properties: {
    _id: { type: types.string },
    email: { type: types.string },
    username: { type: types.string },
    email_verified: { type: types.boolean },
    role: { type: types.string },
    img: { type: types.string },
    premium: { type: types.boolean },
  },
};

export default user;
