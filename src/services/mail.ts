'use strict';

// MODULES
import nodemailer from 'nodemailer';

// INTERFACES
import { Document } from 'mongodb';

// CONFIG
import config from '../config';

// UTILS
import { MailValidator, generate_html, generate_email_reset_token, generate_password_reset_token, generate_email_verification_token } from '../utils/services';

class MailService {
  private options: any;
  private collections: any;
  private transporter: any;
  private mail_validator: any;

  constructor(options: any) {
    if (!options) {
      throw new Error('Too few arguments provided in MailService');
    }

    this.options = options;
    this.collections = options.collections;
    this.mail_validator = new MailValidator(options);
    this.transporter = nodemailer.createTransport({
      host: config.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: config.env.EMAIL_NO_REPLY_USERNAME,
        pass: config.env.EMAIL_NO_REPLY_PASSWORD,
      },
    });

    this.transporter.verify(function (err: any, success: any) {
      if (err) {
        throw err;
      }
    });
  }

  async send_verification_link(payload: any): Promise<void> {
    const user: Document = await this.mail_validator.send_verification_link(payload, this.options);
    const endpoint: string = config.endpoints.verify_email.split(':')[0];

    const { email, token } = payload;

    if (!email || !token) {
      throw new Error('Invalid payload specified in MailService.sendVerificationLink');
    }

    const link: string = 'https://' + config.env.URL_UI + endpoint + token;
    const html: string = generate_html('verify-email', { username: user.username, link });

    const data: object = {
      from: 'no-reply@' + config.env.URL_UI,
      to: email, // to property represents the emails that will be sent emails to.
      subject: 'Welcome to TokensHype, Please Confirm your email',
      html,
    };

    this.transporter.sendMail(data, (err: any, info: any) => {
      if (err) {
        console.log(err);
      }
    });
  }

  async resend_verification_link(email: string): Promise<void> {
    const user: Document = await this.mail_validator.resend_verification_link(email, this.options);
    const endpoint: string = config.endpoints.verify_email.split(':')[0];
    const token: string = await generate_email_verification_token(this.options);

    await this.collections.users.updateOne(
      { email },
      {
        $set: {
          email_verification_token: token,
          email_verification_token_exp_at: new Date(Date.now() + config.times.one_hour_ms * 24),
          updated_at: new Date(),
        },
      },
    );

    const link: string = 'https://' + config.env.URL_UI + endpoint + token;
    const html: string = generate_html('verify-email', { username: user.username, link });

    const data: object = {
      from: 'no-reply@' + config.env.URL_UI,
      to: email, // to property represents the emails that will be sent emails to.
      subject: 'Welcome to TokensHype, Please Confirm your email',
      html,
    };

    this.transporter.sendMail(data, (err: any, info: any) => {
      if (err) {
        console.error(err);
      }
    });
  }

  async send_password_reset_link(email: string): Promise<void> {
    const user: Document = await this.mail_validator.send_password_reset_link(email, this.options);
    const endpoint: string = config.endpoints.reset_password.split(':')[0];
    const token: string = await generate_password_reset_token(this.options);

    await this.collections.users.updateOne(
      { email: email },
      {
        $set: {
          password_reset_token: token,
          password_reset_token_exp_at: new Date(Date.now() + config.times.one_hour_ms * 1),
          updated_at: new Date(),
        },
      },
    );

    const link: string = 'https://' + config.env.URL_UI + endpoint + token;
    const html: string = generate_html('reset-password', { username: user.username, link });

    const data: object = {
      from: 'no-reply@' + config.env.URL_UI,
      to: email, // to property represents the emails that will be sent emails to.
      subject: 'TokensHype Password Reset',
      html,
    };

    this.transporter.sendMail(data, (err: any, info: any) => {
      if (err) {
        throw err;
      }
    });
  }

  async send_email_reset_link(payload: any): Promise<void> {
    const { email, user } = payload;
    await this.mail_validator.send_email_reset_link(email, this.options);
    const endpoint: string = config.endpoints.reset_email.split(':')[0];
    const token: string = await generate_email_reset_token(this.options);

    await this.collections.users.updateOne(
      { _id: user._id },
      {
        $set: {
          email_reset_token: token,
          email_reset_token_exp_at: new Date(Date.now() + config.times.one_hour_ms * 1),
          updated_at: new Date(),
        },
      },
    );

    const data: object = {
      from: 'no-reply@' + config.env.URL_UI,
      to: email, // to property represents the emails that will be sent emails to.
      subject: 'TokensHype Email Reset, Please Enter your New Email',
      html: `<a href="https://${config.env.URL_UI + endpoint + token}">Please click to reset your email</a>`,
    };

    this.transporter.sendMail(data, (err: any, info: any) => {
      if (err) {
        console.error(err);
      }
    });
  }

  async send_emails(credentials: any): Promise<void> {
    const { emails, content } = credentials;

    for (let i: number = 0; i < emails.length; i++) {
      const data: object = {
        from: content.from || config.env.EMAIL_NO_REPLY_USERNAME,
        to: emails[i], // to property represents the emails that will be sent emails to.
        subject: content.subject,
        html: content.html,
      };

      this.transporter.sendMail(data, (err: any, info: any) => {
        if (err) {
          console.error(err);
        }
      });
    }
  }
}

export default MailService;
