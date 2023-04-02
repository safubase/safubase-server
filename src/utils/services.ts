'use strict';

// MODULES
import validator from 'validator';
import axios from 'axios';
import Crypto from 'crypto-js';

// INTERFACES
import { Document } from 'mongodb';

// CONFIG
import config from '../config';

// COMMON UTILS
import UTILS_COMMON from './common';

/**
 *
 * AUTH UTILS
 *
 */
export class AuthValidator {
  private options: any;
  private collections: any;

  constructor(options: any) {
    this.options = options;
    this.collections = options.collections;
  }

  async edit_profile(credentials: any): Promise<void> {
    const err = { section: 'auth', type: 'edit-profile' };

    if (!credentials) {
      throw { message: "User Credentials hasn't been provided", type: `${err.section}:${err.type}` };
    }

    const { user, img_base64 } = credentials;
    const username = UTILS_COMMON.str_remove_extra_space(credentials.username).toLowerCase();

    if (!username) {
      throw { message: "Username hasn't been provided", type: `${err.section}:${err.type}` };
    }

    if (typeof username !== config.types.string || typeof img_base64 !== config.types.string) {
      throw { message: 'Credentials are in invalid type', type: `${err.section}:${err.type}` };
    }

    if (username.length > 50) {
      throw { message: 'Username length are too high', type: `${err.section}:${err.type}` };
    }

    if (!username) {
      throw { message: 'Username is invalid', type: `${err.section}:${err.type}` };
    }

    if (img_base64.length > 1000000) {
      throw { message: 'Profile image is too big', type: `${err.section}:${err.type}` };
    }

    if (username.includes(' ') || !validator.isAlphanumeric(username)) {
      throw { message: 'Username is invalid', type: `${err.section}:${err.type}` };
    }

    if (username !== user.username) {
      const existing_user = await this.collections.users.findOne({ username: username });

      if (existing_user) {
        throw { message: 'This username is taken', type: `${err.section}:${err.type}` };
      }

      if (user.username_changed_at && Date.now() - user.username_changed_at.valueOf() < config.times.one_day_ms * 30) {
        throw { message: 'You can only change your username in every 30 days', type: `${err.section}:${err.type}` };
      }
    }

    if (username === user.username && !img_base64) {
      throw { message: 'No changes have been made', type: `${err.section}:${err.type}` };
    }

    if (img_base64) {
      UTILS_COMMON.validate_base64(img_base64, err);
    }
  }

  async signup(credentials: any): Promise<void> {
    const types = config.types;
    const err = { section: 'auth', type: 'signup' };

    if (!credentials) {
      throw { message: "User credentials hasn't been provided", type: `${err.section}:${err.type}` };
    }

    if (typeof credentials !== types.object) {
      throw { message: 'Credentials are invalid', type: `${err.section}:${err.type}` };
    }

    const { ip, password, password_verification, captcha_token } = credentials;

    const email: string = UTILS_COMMON.str_remove_extra_space(credentials.email).toLowerCase();
    const username: string = UTILS_COMMON.str_remove_extra_space(credentials.username).toLowerCase();

    if (!ip || !email || !username || !password || !password_verification) {
      throw { message: 'Credentials are missing', type: `${err.section}:${err.type}` };
    }

    if (!captcha_token) {
      throw { message: 'Captcha is missing', type: `${err.section}:${err.type}` };
    }

    if (typeof ip !== types.string || typeof email !== types.string || typeof username !== types.string || typeof password !== types.string || typeof password_verification !== types.string || typeof captcha_token !== types.string) {
      throw { message: 'Invalid Username', type: `${err.section}:${err.type}` };
    }

    if (!validator.isIP(ip)) {
      throw { message: 'Invalid ip', type: `${err.section}:${err.type}` };
    }

    if (email.length > 100 || username.length > 50 || password.length > 50 || password_verification.length > 50) {
      throw { message: 'Email or username or password length are too high', type: `${err.section}:${err.type}` };
    }

    if (!username || username.includes(' ') || !validator.isAlphanumeric(username) || Number(username)) {
      throw { message: 'Invalid username', type: `${err.section}:${err.type}` };
    }

    if (password.includes(' ')) {
      throw { message: 'Password cannot contain space', type: `${err.section}:${err.type}` };
    }

    if (!validator.isEmail(email)) {
      throw { message: 'Email is invalid', type: `${err.section}:${err.type}` };
    }

    if (password !== password_verification) {
      throw { message: "Passwords doesn't match", type: `${err.section}:${err.type}` };
    }

    const password_config = {
      minSymbols: 0,
      minNumbers: 0,
      minLowercase: 0,
      minUppercase: 0,
    };

    if (!validator.isStrongPassword(password, password_config)) {
      throw { message: 'Password is weak. (at least 1 number and 8 characters minimum)', type: `${err.section}:${err.type}` };
    }

    const existing_user = await this.collections.users.findOne({
      $or: [{ email: email }, { username: username }],
    });

    if (existing_user) {
      throw { message: 'User with the given credentials is already exists', type: `${err.section}:${err.type}` };
    }

    const captcha_body: string = 'response=' + captcha_token + '&secret=' + config.env.SECRET_KEY_CAPTCHA;
    const catpcha_response: any = await axios.post('https://hcaptcha.com/siteverify', captcha_body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!catpcha_response) {
      throw { message: 'Captcha didnt succeed', type: `${err.section}:${err.type}` };
    }

    if (!catpcha_response.data.success) {
      throw { message: 'Captcha didnt succeed', type: `${err.section}:${err.type}` };
    }
  }

  async signin(credentials: any): Promise<Document> {
    const err = { section: 'auth', type: 'signin' };

    if (!credentials || typeof credentials !== config.types.object) {
      throw { message: "User credentials hasn't been provided", type: `${err.section}:${err.type}` };
    }

    const { ip, uid, password }: any = credentials;

    if (!ip || !uid || !password) {
      throw { message: 'Missing credentials while signing in', type: `${err.section}:${err.type}` };
    }

    if (typeof ip !== config.types.string || typeof uid !== config.types.string || typeof password !== config.types.string) {
      throw { message: 'Given credentials are invalid', type: `${err.section}:${err.type}` };
    }

    if (!validator.isIP(ip)) {
      throw { message: 'IP is not valid', type: `${err.section}:${err.type}` };
    }

    const user: Document | null = await this.collections.users.findOne({
      $or: [{ email: uid.toLowerCase() }, { username: uid.toLowerCase() }],
    });

    if (!user) {
      throw { message: 'Cannot find the user with the given credentials', type: `${err.section}:${err.type}` };
    }

    if (user.password !== Crypto.SHA256(password).toString()) {
      throw { message: 'Wrong password or Unique ID (email or username), Please try again.', type: `${err.section}:${err.type}` };
    }

    return user;
  }

  async signout(credentials: any): Promise<void> {
    const types = config.types;
    const err = { section: 'auth', type: 'signout' };
    const user: Document | null = this.collections.users.findOne({ _id: credentials.user._id });

    if (!user) {
      throw { message: "User couldn't be found", type: `${err.section}:${err.type}` };
    }
  }

  async reset_password(credentials: any): Promise<void> {
    const types = config.types;
    const err = { section: 'auth', type: 'reset-password' };

    if (!credentials || typeof credentials !== types.object) {
      throw { message: "User Credentials hasn't been provided", type: `${err.section}:${err.type}` };
    }

    const { password, password_verification, token } = credentials;

    if (!password || !password_verification || !token) {
      throw { message: "User Credentials hasn't been provided", type: `${err.section}:${err.type}` };
    }

    if (typeof password !== types.string || typeof password_verification !== types.string || typeof token !== types.string) {
      throw { message: "User Credentials hasn't been provided", type: `${err.section}:${err.type}` };
    }

    if (password.length > 50 || password_verification.length > 50 || token.length > 256) {
      throw { message: "User Credentials hasn't been provided", type: `${err.section}:${err.type}` };
    }

    if (password.includes(' ')) {
      throw { message: 'Invalid password', type: `${err.section}:${err.type}` };
    }

    if (password !== password_verification) {
      throw { message: "Passwords doesn't match", type: `${err.section}:${err.type}` };
    }

    const passwordConfig = {
      minSymbols: 0,
      minNumbers: 0,
      minLowercase: 0,
      minUppercase: 0,
    };

    if (!validator.isStrongPassword(password, passwordConfig)) {
      throw { message: 'Password is weak. It should contain at least One Upper Case Character, One Number, One Special Character and it should be 8 characters long.', type: `${err.section}:${err.type}` };
    }

    const user: Document | null = await this.collections.users.findOne({ password_reset_token: token });

    if (!user) {
      throw { message: "User with this token couldn't be found", type: `${err.section}:${err.type}` };
    }

    if (!user.password_resetToken || !user.password_reset_token_exp_at) {
      throw { message: "User credentials with this token couldn't be found", type: `${err.section}:${err.type}` };
    }

    if (user.password_resetToken !== token) {
      throw { message: 'Wrong Token specified while changing the password', type: `${err.section}:${err.type}` };
    }

    if (user.passwordResetTokenExpDate.valueOf() < Date.now()) {
      throw { message: 'Token has expired', type: `${err.section}:${err.type}` };
    }
  }

  async change_password(credentials: any): Promise<void> {
    const err = { section: 'auth', type: 'change-password' };

    if (!credentials || typeof credentials !== config.types.object) {
      throw { message: 'Invalid credentials', type: `${err.section}:${err.type}` };
    }

    const { user, password, new_password, new_password_verification }: any = credentials;

    if (!password || !new_password || !new_password_verification) {
      throw { message: 'Credential properties are missing', type: `${err.section}:${err.type}` };
    }

    if (typeof password !== config.types.string || typeof new_password !== config.types.string || typeof new_password_verification !== config.types.string) {
      throw { message: 'Credential properties are missing', type: `${err.section}:${err.type}` };
    }

    if (password.length > 50 || new_password.length > 50 || new_password_verification.length > 256) {
      throw { message: 'Credential properties are invalid', type: `${err.section}:${err.type}` };
    }

    if (new_password.includes(' ')) {
      throw { message: 'New password is invalid', type: `${err.section}:${err.type}` };
    }

    if (new_password !== new_password_verification) {
      throw { message: "Passwords doesn't match", type: `${err.section}:${err.type}` };
    }

    if (user.password !== Crypto.SHA256(password).toString()) {
      throw { message: 'Wrong password', type: `${err.section}:${err.type}` };
    }

    const passwordConfig: object = {
      minSymbols: 0,
    };

    if (!validator.isStrongPassword(new_password, passwordConfig)) {
      throw { message: 'Password is weak. It should contain at least One Upper Case Character, One Number, One Special Character and it should be 8 characters long.', type: `${err.section}:${err.type}` };
    }
  }

  async reset_email(credentials: any): Promise<void> {
    const err = { section: 'auth', type: 'reset-email' };

    if (!credentials) {
      throw { message: "User Credentials hasn't been provided", type: `${err.section}:${err.type}` };
    }

    if (typeof credentials.email !== config.types.string) {
      throw { message: 'Credentials are invalid', type: `${err.section}:${err.type}` };
    }

    if (credentials.email.length > 256) {
      throw { message: 'Email or token is too long', type: `${err.section}:${err.type}` };
    }

    if (!validator.isEmail(credentials.email)) {
      throw { message: 'Email is invalid', type: `${err.section}:${err.type}` };
    }

    const existing_user: Document | null = await this.collections.users.findOne({ email: credentials.email });

    if (existing_user) {
      throw { message: 'User with this email already in use', type: `${err.section}:${err.type}` };
    }
  }

  async verify_email(token: string): Promise<Document> {
    const err = { section: 'auth', type: 'verify-email' };

    if (!token || token.includes(' ')) {
      throw { message: "Token hasn't been provided", type: `${err.section}:${err.type}` };
    }

    if (typeof token !== config.types.string) {
      throw { message: 'Token is in Invalid Type', type: `${err.section}:${err.type}` };
    }

    if (!validator.isAlphanumeric(token)) {
      throw { message: 'Token is in invalid format', type: `${err.section}:${err.type}` };
    }

    if (token.length > 256) {
      throw { message: 'Token is too long', type: `${err.section}:${err.type}` };
    }

    const user: Document | null = await this.collections.users.findOne({
      email_verification_token: token,
    });

    if (!user || !user.email_verification_token_exp_at || !user.email_verification_token) {
      throw { message: 'User with this token is missing', type: `${err.section}:${err.type}` };
    }

    if (user.email_verification_token_exp_at.valueOf() < Date.now()) {
      throw { message: 'Token has expired', type: `${err.section}:${err.type}` };
    }

    if (user.email_verification_token !== token) {
      throw { message: "Tokens doesn't match", type: `${err.section}:${err.type}` };
    }

    return user;
  }
}

async function generate_ref_code(options: any): Promise<string> {
  const length: number = 6;
  let code: string = Crypto.lib.WordArray.random(length).toString().toUpperCase();
  let user: Document = await options.collections.users.findOne({ ref_code: code });

  while (user) {
    code = Crypto.lib.WordArray.random(length).toString().toUpperCase();
    user = await options.collections.users.findOne({ ref_code: code });
  }

  return code;
}

export async function create_session(payload: any, options: any): Promise<string> {
  const redis = options.redis;
  let sid: string = Crypto.lib.WordArray.random(128).toString();
  let existing_session: string | null = await redis.hGet('sessions', sid);

  while (existing_session) {
    sid = Crypto.lib.WordArray.random(128).toString();
    existing_session = await redis.hGet('sessions', sid);
  }

  // example session id vaule: 1af904ab_123.34.37.23_123
  await redis.hSet('sessions', sid, payload.user_id.toString() + '_' + payload.ip + '_' + Date.now());
  return sid;
}

export async function generate_email_verification_token(options: any): Promise<string> {
  let token: string = Crypto.lib.WordArray.random(128).toString();
  let user: Document | null = await options.collections.users.findOne({ email_verification_token: token });

  while (user) {
    token = Crypto.lib.WordArray.random(128).toString();
    user = await options.collections.users.findOne({ email_verification_token: token });
  }

  return token;
}

export async function generate_password_reset_token(options: any): Promise<string> {
  let token: string = Crypto.lib.WordArray.random(128).toString();
  let user: Document | null = await options.collections.users.findOne({ password_reset_token: token });

  while (user) {
    token = Crypto.lib.WordArray.random(128).toString();
    user = await options.collections.users.findOne({ password_reset_token: token });
  }

  return token;
}

async function generate_api_key(options: any): Promise<string> {
  const LENGTH: number = 40;
  const buffer: string[] = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890'.split('');
  const len_buf: number = buffer.length;

  // mix the chars in buffer
  for (let i: number = 0; i < len_buf; i++) {
    const randx: number = Math.floor(Math.random() * len_buf);
    const randy: number = Math.floor(Math.random() * len_buf);
    const saved: string = buffer[randx];

    buffer[randx] = buffer[randy];
    buffer[randy] = saved;
  }

  let key: string = '';
  const namespace: string = options.env.DB_NAME;
  // len_ran: length of random on the right side of the string.
  const len_ran: number = LENGTH - (namespace.length + 1); // + 1: underscore on the middle

  for (let i: number = 0; i < len_ran; i++) {
    key = key + buffer[i];
  }

  key = namespace + '_' + key;

  let user: Document | null = await options.collections.users.findOne({ api_key: key });

  while (user) {
    key = '';

    for (let i = 0; i < len_buf; i++) {
      const randx: number = Math.floor(Math.random() * len_buf);
      const randy: number = Math.floor(Math.random() * len_buf);

      const saved: string = buffer[randx];

      buffer[randx] = buffer[randy];
      buffer[randy] = saved;
    }

    for (let i = 0; i < len_ran; i++) {
      key = key + buffer[i];
    }

    key = namespace + '_' + key;

    user = await options.collections.users.findOne({ api_key: key });
  }

  return key;
}

export async function create_user_doc(credentials: any, options: any): Promise<any> {
  const email_verification_token: string = await generate_email_verification_token(options);
  const ref_code: string = await generate_ref_code(options);
  const api_key: string = await generate_api_key(options);

  const doc: any = {
    username: UTILS_COMMON.str_remove_extra_space(credentials.username).toLowerCase(),
    username_changed_at: null,
    email: UTILS_COMMON.str_remove_extra_space(credentials.email).toLowerCase(),
    password: Crypto.SHA256(credentials.password).toString(),
    email_verified: false,
    email_verification_token,
    email_verification_token_exp_at: new Date(Date.now() + config.times.one_hour_ms * 24),
    password_reset_token: null,
    password_reset_token_exp_at: null,
    img: '',
    ref_code: ref_code,
    ref_from: null,
    api_key: api_key,
    role: config.roles.user,
    permission: config.permissions.user,
    last_ip: credentials.ip,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return doc;
}

/**
 *
 * MAIL UTILS
 *
 */
export class MailValidator {
  private collections: any;

  constructor(options: any) {
    this.collections = options.collections;
  }

  async send_verification_link(payload: any): Promise<Document> {
    const err = { section: 'mail', type: 'send-verification-link' };

    if (!payload.email || !payload.token || payload.token.includes(' ')) {
      throw { message: "Email or token hasn't been provided", code: `${err.section}:${err.type}` };
    }

    if (typeof payload.email !== config.types.string || typeof payload.token !== config.types.string) {
      throw { message: 'Email or Token is in invalid type', code: `${err.section}:${err.type}` };
    }

    if (!validator.isEmail(payload.email)) {
      throw { message: 'Email is invalid', code: `${err.section}:${err.type}` };
    }

    if (!validator.isAlphanumeric(payload.token)) {
      throw { message: 'Token is in invalid format', code: `${err.section}:${err.type}` };
    }

    if (payload.token.length > 256) {
      throw { message: 'Token is too long', code: `${err.section}:${err.type}` };
    }

    const user: Document | null = await this.collections.users.findOne({ email: payload.email });

    if (!user) {
      throw { message: 'User with this token is missing', code: `${err.section}:${err.type}` };
    }

    if (user.email_verified) {
      throw { message: 'Email is already been verified', code: `${err.section}:${err.type}` };
    }

    return user;
  }

  async resend_verification_link(email: string): Promise<Document> {
    const err = { section: 'mail', type: 'resend-verification-link' };

    if (!email) {
      throw { message: "Email  hasn't been provided", code: `${err.section}:${err.type}` };
    }

    if (typeof email !== config.types.string) {
      throw { message: 'Email is in Invalid type', code: `${err.section}:${err.type}` };
    }

    if (!validator.isEmail(email)) {
      throw { message: 'Email is invalid', code: `${err.section}:${err.type}` };
    }

    const user: Document | null = await this.collections.users.findOne({ email });

    if (!user) {
      throw { message: 'User with this token is missing', code: `${err.section}:${err.type}` };
    }

    if (user.email_verified) {
      throw { message: 'Email is already been verified', code: `${err.section}:${err.type}` };
    }

    return user;
  }

  async send_password_reset_link(email: string): Promise<Document> {
    const err = { section: 'mail', type: 'send-password-reset-link' };

    if (!email) {
      throw { message: "Email  hasn't been provided", code: `${err.section}:${err.type}` };
    }

    if (typeof email !== config.types.string) {
      throw { message: 'Email is in Invalid type', code: `${err.section}:${err.type}` };
    }

    if (email.length > 200) {
      throw { message: 'Email is too long', code: `${err.section}:${err.type}` };
    }

    if (!validator.isEmail(email)) {
      throw { message: 'Email is invalid', code: `${err.section}:${err.type}` };
    }

    const user: Document | null = await this.collections.users.findOne({
      email,
    });

    if (!user) {
      throw { message: "User with this email couldn't be found", code: `${err.section}:${err.type}` };
    }

    return user;
  }

  async send_email_reset_link(email: string): Promise<void> {
    const types = config.types;
    const err = { section: 'mail', type: 'send-email-reset-link' };

    if (!email) {
      throw { message: "Email  hasn't been provided", code: `${err.section}:${err.type}` };
    }

    if (typeof email !== types.string) {
      throw { message: 'Email is in Invalid type', code: `${err.section}:${err.type}` };
    }

    if (email.length > 200) {
      throw { message: 'Email is too long', code: `${err.section}:${err.type}` };
    }

    if (!validator.isEmail(email)) {
      throw { message: 'Email is invalid', code: `${err.section}:${err.type}` };
    }

    const existing_user: Document | null = await this.collections.users.findOne({
      email,
    });

    if (existing_user) {
      throw { message: 'User with this email is already exist', code: `${err.section}:${err.type}` };
    }
  }

  async add_subscription_email(credentials: any): Promise<void> {
    const err = { section: 'mail', type: 'add-subscription-email' };

    if (!credentials.email) {
      throw { message: "Email  hasn't been provided", code: `${err.section}:${err.type}` };
    }

    if (typeof credentials.email !== config.types.string) {
      throw { message: 'Email is in Invalid type', code: `${err.section}:${err.type}` };
    }

    if (credentials.email.length > 300) {
      throw { message: 'Email is too long', code: `${err.section}:${err.type}` };
    }

    if (!validator.isEmail(credentials.email)) {
      throw { message: 'Email is invalid', code: `${err.section}:${err.type}` };
    }

    const existing_email: Document | null = await this.collections.subscription_emails.findOne({
      email: credentials.email,
    });

    if (existing_email) {
      throw { message: 'Email already exists', code: `${err.section}:${err.type}` };
    }
  }
}

export function generate_html(type = 'verify-email', payload: any): string {
  switch (type) {
    case 'verify-email':
      return (
        '<!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8" /> <meta http-equiv="X-UA-Compatible" content="IE=edge" /> <meta name="viewport" content="width=device-width, initial-scale=1.0" /> <link rel="preconnect" href="https://fonts.googleapis.com" /> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /> <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" /> <title>' +
        config.env.URL_UI +
        '</title> <style rel="stylesheet"> * { margin: 0; padding: 0; box-sizing: border-box; font-family: Poppins, sans-serif; text-decoration: none; } .content-area { border: 1px solid rgb(219, 219, 219); border-radius: 5px; max-width: 500px; padding: 3rem; } .main-logo { width: 100%; position: relative; } .main-logo > a { display: block; width: 100%; text-align: center; border-radius: 4px; font-weight: bold; color: rgb(54, 54, 54); font-size: 28px; } .content-area > h1 { margin-top: 2rem; font-size: 18px; text-align: center; } .content-area > .p { margin-top: 2rem; text-align: center; } .p > a { text-decoration: none; font-weight: bold; } .subtext { font-size: 12px; } .p > .password-reset-btn { background-color: aquamarine; border-radius: 4px; font-weight: bold; padding: 0.6rem 1.4rem; color: rgb(41, 41, 41); } .p > .username { font-weight: bold; } .footer { text-align: center; margin-top: 2rem; font-size: 12px; } </style> </head> <body> <section class="section"> <div class="content-area"> <div class="main-logo"> <a href="https://' +
        config.env.URL_UI +
        '" target="_blank" rel="referrer"> ' +
        config.env.URL_UI +
        ' </a> </div> <h1>Verify Your Email Address</h1> <div class="p">Hi <span class="username">' +
        payload.username +
        '</span></div> <div class="p"> Please click the button below to verify your email address. </div> <div class="p subtext"> If you didnt signup to ' +
        config.env.URL_UI +
        '.com please ignore this email. </div> <div class="p btn-area"> <a href="' +
        payload.link +
        '" target="_blank" rel="referrer" class="password-reset-btn" > Verify Email </a> </div> <footer class="footer"> © 2022 ' +
        config.env.URL_UI +
        '.com | All rights reserved. </footer> </div> </section> </body></html>'
      );

    case 'reset-password':
      return (
        '<!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8" /> <meta http-equiv="X-UA-Compatible" content="IE=edge" /> <meta name="viewport" content="width=device-width, initial-scale=1.0" /> <link rel="preconnect" href="https://fonts.googleapis.com" /> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /> <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" /> <title>' +
        config.env.URL_UI +
        '</title> <style rel="stylesheet"> * { margin: 0; padding: 0; box-sizing: border-box; font-family: Poppins, sans-serif; text-decoration: none; } .content-area { border: 1px solid rgb(219, 219, 219); border-radius: 5px; max-width: 500px; padding: 3rem; } .main-logo { width: 100%; position: relative; } .main-logo > a { display: block; width: 100%; text-align: center; border-radius: 4px; font-weight: bold; color: rgb(54, 54, 54); font-size: 28px; } .content-area > h1 { margin-top: 2rem; font-size: 18px; text-align: center; } .content-area > .p { margin-top: 2rem; text-align: center; } .content-area > .p > a { font-size: 16px; text-decoration: none; font-weight: bold; } .subtext { font-size: 12px; } .p > .password-reset-btn { background-color: aquamarine; border-radius: 4px; font-weight: bold; padding: 0.6rem 1.4rem; color: rgb(41, 41, 41); } .footer { text-align: center; margin-top: 2rem; font-size: 12px; } </style> </head> <body> <section class="section"> <div class="content-area"> <div class="main-logo"> <a href="https://' +
        config.env.URL_UI +
        '.com" target="_blank" rel="referrer"> ' +
        config.env.URL_UI +
        ' </a> </div> <h1>Reset Your Password</h1> <div class="p">Hi @' +
        payload.username +
        '</div> <div class="p"> Please click the button below to reset your password </div> <div class="p subtext"> If you didnt send password reset submission please ignore this email. </div> <div class="p btn-area"> <a href="' +
        payload.link +
        '" target="_blank" rel="referrer" class="password-reset-btn" > Reset Password </a> </div> <footer class="footer"> © 2022 ' +
        config.env.URL_UI +
        '.com | All rights reserved. </footer> </div> </section> </body></html>'
      );

    case 'new-ip':
      return (
        '<!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8" /> <meta http-equiv="X-UA-Compatible" content="IE=edge" /> <meta name="viewport" content="width=device-width, initial-scale=1.0" /> <link rel="preconnect" href="https://fonts.googleapis.com" /> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /> <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" /> <title>' +
        config.env.URL_UI +
        '</title> <style rel="stylesheet"> * { margin: 0; padding: 0; box-sizing: border-box; font-family: Poppins, sans-serif; text-decoration: none; } .content-area { border: 1px solid rgb(219, 219, 219); border-radius: 5px; max-width: 500px; padding: 3rem; } .main-logo { width: 100%; position: relative; } .main-logo > a { display: block; width: 100%; text-align: center; border-radius: 4px; font-weight: bold; color: rgb(54, 54, 54); font-size: 28px; } .content-area > h1 { margin-top: 2rem; font-size: 18px; text-align: center; } .content-area > .p { margin-top: 2rem; font-size: 14px; text-align: center; } .content-area > .p > a { display: block; font-size: 16px; color: #2addcb; text-decoration: none; font-weight: bold; } .footer { text-align: center; margin-top: 2rem; font-size: 12px; } </style> </head> <body> <section class="section"> <div class="content-area"> <div class="main-logo"> <a href="https://' +
        config.env.URL_UI +
        '" target="_blank" rel="referrer"> ' +
        config.env.URL_UI +
        ' </a> </div> <h1> New login to your account @' +
        payload.username +
        ' from a new device. Was this you? </h1> <div class="p">New Login IP: ' +
        payload.ip +
        '</div> <div class="p"> If this was you You can ignore this message. There\'s no need to take any action. </div> <div class="p"> If this wasn’t you should change your password by going to your profile below. </div> <div class="p profile-link"> <a href="https://' +
        config.env.URL_UI +
        '/profile" target="_blank" rel="referrer" >' +
        config.env.URL_UI +
        '</a > </div> <footer class="footer"> © 2022 ' +
        config.env.URL_UI +
        '.com | All rights reserved. </footer> </div> </section> </body></html>'
      );
    default:
      return '';
  }
}

export function create_subscription_email_doc(credentials: any): object {
  const doc: any = {
    email: UTILS_COMMON.str_remove_extra_space(credentials.email).toLowerCase(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  return doc;
}

/**
 *
 * BLOCKCHAIN UTILS
 *
 *
 */
export class BlockchainValidator {
  private collections: any;

  constructor(options: any) {
    this.collections = options.collections;
  }

  async get_whales(credentials: any): Promise<void> {
    const err = { section: 'blockchain', type: 'get-whales' };

    if (!credentials) {
      throw { message: "Blockchain Credentials hasn't been provided", type: `${err.section}:${err.type}` };
    }

    if (!credentials.chain || typeof credentials.chain !== config.types.string) {
      throw { message: 'Chain is not provided', type: `${err.section}:${err.type}` };
    }
  }

  async get_upcoming_unlocks(credentials: any): Promise<void> {
    const err = { section: 'blockchain', type: 'get-upcoming-unlocks' };

    if (!credentials) {
      throw { message: "Blockchain Credentials hasn't been provided", type: `${err.section}:${err.type}` };
    }
  }
}

export default {
  AuthValidator,
  create_session,
  generate_email_verification_token,
  generate_password_reset_token,
  create_user_doc,
  MailValidator,
  generate_html,
  create_subscription_email_doc,
  BlockchainValidator,
};
