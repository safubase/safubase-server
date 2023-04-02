'use strict';

// CONFIG
import config from '../config';

const schema = {
  name: 'users',
  bsonType: config.types.object,
  required: ['username', 'email'],
  unique_props: ['username', 'email'],
  properties: {
    username: {
      bsonType: config.types.string,
    },
    username_changed_at: {
      bsonType: [config.types.date, config.types.null],
    },
    email: {
      bsonType: config.types.string,
    },
    password: {
      bsonType: config.types.string,
    },
    email_verified: {
      bsonType: [config.types.bool, config.types.null],
    },
    email_verification_token: {
      bsonType: [config.types.string, config.types.null],
    },
    email_verification_token_exp_at: {
      bsonType: [config.types.date, config.types.null],
    },
    password_reset_token: {
      bsonType: [config.types.string, config.types.null],
    },
    password_reset_token_exp_at: {
      bsonType: [config.types.date, config.types.null],
    },
    img: {
      bsonType: config.types.string,
    },
    ref_code: {
      bsonType: config.types.string,
    },
    ref_from: {
      bsonType: [config.types.objectId, config.types.null],
    },
    api_key: {
      bsonType: [config.types.string, config.types.null],
    },
    role: {
      enum: [config.roles.admin, config.roles.user],
    },
    permission: {
      enum: [config.permissions.user, config.permissions.admin],
    },
    ip: {
      bsonType: config.types.string,
    },
    created_at: {
      bsonType: [config.types.date, config.types.null],
    },
    updated_at: {
      bsonType: [config.types.date, config.types.null],
    },
  },
};

export default schema;
