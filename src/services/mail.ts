'use strict';

// MODULES
import nodemailer from 'nodemailer';

// INTERFACES
import { Document } from 'mongodb';

// CONFIG
import config from '../config';

// UTILS
import UTILS_SERVICES from '../utils/services';

class MailService {
  private options: any;
  private collections: any;
  private transporter: any;
  private mail_validator: any;

  constructor(options: any) {
    this.options = options;
    this.collections = options.collections;
    this.mail_validator = new UTILS_SERVICES.MailValidator(options);
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
    const endpoint: string = config.endpoints.auth_verify_email.split(':')[0];
    const link: string = 'https://' + config.env.URL_UI + endpoint + payload.token;
    const html: string = UTILS_SERVICES.generate_html('verify-email', { username: user.username, link });
    const data: object = {
      from: config.env.EMAIL_NO_REPLY_USERNAME,
      to: payload.email, // to property represents the emails that will be sent emails to.
      subject: 'Welcome to ' + config.env.URL_UI + ', Please Confirm your email',
      html,
    };

    this.transporter.sendMail(data, (err: any, info: any) => {
      if (err) {
        console.log(err);
      }
    });
  }

  // Generates an email verification token, update users email verification token in the database, sends the verification link to users email
  async resend_verification_link(email: string): Promise<void> {
    const user: Document = await this.mail_validator.resend_verification_link(email, this.options);
    const endpoint: string = config.endpoints.auth_verify_email.split(':')[0];
    const token: string = await UTILS_SERVICES.generate_email_verification_token(this.options);

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
    const html: string = UTILS_SERVICES.generate_html('verify-email', { username: user.username, link });
    const data: object = {
      from: config.env.EMAIL_NO_REPLY_USERNAME,
      to: email, // to property represents the emails that will be sent emails to.
      subject: 'Welcome back, ' + config.env.URL_UI + ', Please Confirm your email',
      html,
    };

    this.transporter.sendMail(data, (err: any, info: any) => {
      if (err) {
        console.error(err);
      }
    });
  }

  // Generates a password reset token, updated users password reset token in the database, sends the reset link to users email
  async send_password_reset_link(email: string): Promise<void> {
    const user: Document = await this.mail_validator.send_password_reset_link(email);
    const endpoint: string = config.endpoints.auth_reset_password.split(':')[0];
    const token: string = await UTILS_SERVICES.generate_password_reset_token(this.options);

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
    const html: string = UTILS_SERVICES.generate_html('reset-password', { username: user.username, link });
    const data: object = {
      from: config.env.EMAIL_NO_REPLY_USERNAME,
      to: email, // to property represents the emails that will be sent emails to.
      subject: config.env.URL_UI + ' Password Reset',
      html,
    };

    this.transporter.sendMail(data, (err: any, info: any) => {
      if (err) {
        throw err;
      }
    });
  }

  async send_emails(credentials: any): Promise<void> {
    for (let i: number = 0; i < credentials.emails.length; i++) {
      const data: object = {
        from: credentials.content.from || config.env.EMAIL_NO_REPLY_USERNAME,
        to: credentials.emails[i], // to property represents the emails that will be sent emails to.
        subject: credentials.content.subject,
        html: credentials.content.html,
      };

      this.transporter.sendMail(data, (err: any, info: any) => {
        if (err) {
          console.log(err);
          console.error(err);
        }
      });
    }
  }

  async add_subscription_email(credentials: any): Promise<Document> {
    await this.mail_validator.add_subscription_email(credentials);
    const doc = UTILS_SERVICES.create_subscription_email_doc(credentials);
    const result = await this.options.collections.subscription_emails.insertOne(doc);
    return doc;
  }
}

export default MailService;
