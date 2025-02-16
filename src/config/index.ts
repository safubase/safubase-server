'use strict';

//  MODULES
import dotenv from 'dotenv';

// INTERFACES
import IConfig from 'interfaces/config';

// Bind .env file to the process.env;
const env = dotenv.config();

if (env.error) {
  // This error should crash whole process
  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

const config: IConfig = {
  env: {
    PORT: process.env.PORT || '3001',
    HOST: process.env.HOST || '127.0.0.1',
    NODE_ENV: process.env.NODE_ENV || 'production',
    SESSION_SECRET: process.env.SESSION_SECRET || '',
    SESSION_LIFETIME: 3600000000 * 5,
    SESSION_LIFETIME_MS: 3600000000 * 5,
    SESSION_NAME: process.env.SESSION_NAME || '',
    DB_CONN_STR: process.env.DB_CONN_STR || '',
    DB_NAME: process.env.DB_NAME || '',
    EMAIL_HOST: process.env.EMAIL_HOST || '',
    EMAIL_NO_REPLY_USERNAME: process.env.EMAIL_NO_REPLY_USERNAME || '',
    EMAIL_NO_REPLY_PASSWORD: process.env.EMAIL_NO_REPLY_PASSWORD || '',
    URL_API: process.env.URL_API || '',
    URL_UI: process.env.URL_UI || '',
    IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY || '',
    IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY || '',
    IMAGEKIT_ID: process.env.IMAGEKIT_ID || '',
    SECRET_KEY_CAPTCHA: process.env.SECRET_KEY_CAPTCHA || '',
    API_KEY_MORALIS: process.env.API_KEY_MORALIS || '',
  },
  roles: {
    admin: 'admin',
    user: 'user',
  },
  permissions: {
    admin: process.env.PERM_ADMIN || '',
    user: process.env.PERM_USER || '',
  },
  times: {
    one_min_ms: 60000,
    one_hour_ms: 3600000000,
    one_day_ms: 86400000000,
    one_hour_s: 3600,
  },
  types: {
    objectId: 'objectId',
    string: 'string',
    number: 'number',
    int: 'int',
    float: 'float',
    date: 'date',
    double: 'double',
    boolean: 'boolean',
    bool: 'bool',
    object: 'object',
    array: 'array',
    function: 'function',
    null: 'null',
    undefined: 'undefined',
  },
  endpoints: {
    // AUTH ENDPOINTS
    auth_root: '/',
    auth_profile: '/profile',
    auth_signin: '/signin',
    auth_signup: '/signup',
    auth_signout: '/signout',
    auth_verify_email: '/verify-email/:token',
    auth_change_password: '/change-password',
    auth_reset_password: '/reset-password/:token',
    auth_reset_email: '/reset-email/:token',
    // EMAIL ENDPOINTS
    mail_send_email_verification_link: '/email/send-email-verification-link',
    mail_send_password_reset_link: '/email/send-password-reset-link',
    mail_send_email_reset_link: '/email/send-email-reset-link',
    mail_send_emails: '/email/send-emails',
    mail_subscription_emails: '/email/subscription-emails',

    settings: '/settings',

    blockchain_whales: '/blockchain/whales',
    blockchain_upcoming_unlocks: '/blockchain/upcoming-unlocks',
    blockchain_audit: '/blockchain/audits/:token',
    blockchain_audits: '/blockchain/audits',
  },
};

Object.freeze(config);

export default config;
