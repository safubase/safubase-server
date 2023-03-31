// TYPES
import { THTTPMethods } from 'types/config';

// CLASS TYPES
import AuthService from 'services/auth';
import MailService from 'services/mail';

export interface IServices {
  auth: AuthService;
  mail: MailService;
}

export interface Services_i {
  auth: AuthService;
  mail: MailService;
}

export interface IRoutes {
  [key: string]: {
    method: THTTPMethods;
    url: string;
    handler: (request: any, reply: any) => {};
    schema?: any;
    preValidation?: (request: any, reply: any) => Promise<void>;
  };
}

export interface Routes_i {
  [key: string]: {
    method: THTTPMethods;
    url: string;
    handler: (request: any, reply: any) => {};
    schema?: any;
    preValidation?: (request: any, reply: any) => Promise<void>;
  };
}
