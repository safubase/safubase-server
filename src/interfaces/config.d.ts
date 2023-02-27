import { THTTPMethods, TRoles, TTypes } from 'types/config';

export default interface IConfig {
  readonly env: {
    readonly PORT: string;
    readonly HOST: string;
    readonly NODE_ENV: string;
    readonly SESSION_SECRET: string;
    readonly SESSION_LIFETIME: number;
    readonly SESSION_NAME: string;
    readonly DB_CONN_STR: string;
    readonly DB_NAME: string;
    readonly EMAIL_HOST: string;
    readonly EMAIL_NO_REPLY_USERNAME: string;
    readonly EMAIL_NO_REPLY_PASSWORD: string;
    readonly URL_API: string;
    readonly URL_UI: string;
    readonly IMAGEKIT_PUBLIC_KEY: string;
    readonly IMAGEKIT_PRIVATE_KEY: string;
    readonly IMAGEKIT_ID: string;
    readonly SECRET_KEY_CAPTCHA: string;
  };
  readonly roles: {
    readonly admin: TRoles;
    readonly user: TRoles;
  };
  readonly permissions: {
    readonly admin: string;
    readonly user: string;
  };
  readonly times: {
    readonly one_min_ms: 60000;
    readonly one_hour_ms: 3600000000;
    readonly one_day_ms: 86400000000;
    readonly one_hour_s: 3600;
  };
  readonly types: {
    readonly objectId: TTypes;
    readonly string: TTypes;
    readonly number: TTypes;
    readonly int: TTypes;
    readonly float: TTypes;
    readonly date: TTypes;
    readonly double: TTypes;
    readonly boolean: TTypes;
    readonly bool: TTypes;
    readonly object: TTypes;
    readonly array: TTypes;
    readonly function: TTypes;
    readonly null: TTypes;
    readonly undefined: TTypes;
  };
  readonly endpoints: {
    readonly root: string;
    readonly profile: string;
    readonly signin: string;
    readonly signup: string;
    readonly signout: string;
    readonly verify_email: string;
    readonly change_password: string;
    readonly reset_password: string;
    readonly reset_email: string;
    readonly send_email_verification_link: string;
    readonly send_password_reset_link: string;
    readonly send_email_reset_link: string;
    readonly send_emails: string;
    readonly settings: string;
    readonly whales: string;
    readonly upcoming_unlocks: string;
  };
}
