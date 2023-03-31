'use strict';

// CONFIG
import config from '../config';

const schema = {
  name: 'subscription_emails',
  bsonType: config.types.object,
  required: ['email'],
  unique_props: ['email'],
  properties: {
    email: {
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
