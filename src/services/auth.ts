'use strict';

// MODULES
import Crypto from 'crypto-js';
import ImageKit from 'imagekit';
import validator from 'validator';

// INTERFACES
import { Document, InsertOneResult, ObjectId } from 'mongodb';
import { UploadResponse } from 'imagekit/dist/libs/interfaces';

// CONFIG
import config from '../config';

// UTILS
import { AuthValidator, create_user_doc, create_session, generate_html } from '../utils/services';
import { remove_extra_space } from '../utils/common';

class AuthService {
  private options: any;
  private collections: any;
  private auth_validator: any;
  private imagekit: any;

  constructor(options: any) {
    this.options = options;
    this.collections = options.collections;
    this.auth_validator = new AuthValidator(options);
    this.imagekit = new ImageKit({
      publicKey: config.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: config.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: `https://ik.imagekit.io/${config.env.IMAGEKIT_ID}/`,
    });
  }

  async get_profile(credentials: any): Promise<any | null> {
    const session: string | null = await this.options.redis.hGet('sessions', credentials.sid);

    if (!session) {
      return null;
    }

    const sparts: string[] = session.split('_');
    const user_id: string = sparts[0];
    const ip: string = sparts[1];
    const time: string = sparts[2];

    if (Number(time) + config.env.SESSION_LIFETIME < Date.now()) {
      return null;
    }

    if (ip !== credentials.ip) {
      return null;
    }

    const user: Document = await this.options.collections.users.findOne({ _id: new ObjectId(user_id) });

    if (!user) {
      return null;
    }

    const { _id, email, username, email_verified, role, img, premium }: Document = user;
    const profile = {
      _id,
      email,
      username,
      email_verified,
      role,
      img,
      premium,
    };

    return profile;
  }

  async edit_profile(credentials: any): Promise<any> {
    await this.auth_validator.edit_profile(credentials, this.options);

    const user: Document = credentials.user;
    const username: string = remove_extra_space(credentials.username).toLowerCase();
    const img_base64: string = credentials.img_base64;
    let imagekit_url: string = '';

    if (img_base64) {
      const base64_buffer: string[] = img_base64.split(';base64,');
      const base64_type: string = base64_buffer[0];
      const base64_data: string = base64_buffer[1];
      const file_ext: string = base64_type.split('/')[1];
      const file_name: string = Crypto.lib.WordArray.random(32).toString() + '.' + file_ext;

      const res: UploadResponse = await this.imagekit.upload({
        file: base64_data,
        fileName: file_name,
      });

      imagekit_url = res.url;
    }

    // update user credentials
    await this.collections.users.updateOne(
      { _id: user._id },
      {
        $set: {
          username,
          username_changed_at: username !== user.username ? new Date() : user.username_changed_at,
          img: imagekit_url ? imagekit_url : user.img,
        },
      },
    );

    // create client user to send it back to client to see the updated values.
    const profile = {
      _id: user._id,
      email: user.email,
      username,
      email_verified: user.email_verified,
      role: user.role,
      img: user.img,
    };

    return profile;
  }

  async signup(credentials: any): Promise<any> {
    await this.auth_validator.signup(credentials, this.options);

    const doc = await create_user_doc(credentials, this.options);

    const insert_one_result: InsertOneResult = await this.collections.users.insertOne(doc);

    const sid: string = await create_session({ user_id: insert_one_result.insertedId.toString(), ip: credentials.ip }, this.options);

    const profile = {
      _id: insert_one_result.insertedId,
      email: doc.email,
      username: doc.username,
      email_verified: doc.email_verified,
      role: doc.role,
      img: doc.img,
    };

    const result = {
      user: profile,
      sid: sid,
      email_verification_token: doc.email_verification_token,
    };

    return result;
  }

  async signin(credentials: any): Promise<any> {
    // check all the credentials, just a bunch of if statements, all valid if the array is empty.
    const user: Document = await this.auth_validator.signin(credentials, this.options);
    const premium: Document | null = await this.collections.premiums.findOne({ user_id: user._id });

    if (premium && premium.exp_at.valueOf() > new Date().valueOf() && premium.status === 2) {
      user.premium = true;
    }

    const { ip, mail_service } = credentials;
    const last_ip: string = user.last_ip || '';

    if (ip !== last_ip && validator.isIP(last_ip) && last_ip) {
      const content = {
        subject: `New Login to ${config.env.URL_UI} from:` + ip,
        html: generate_html('new-ip', { username: user.username, ip }),
      };

      mail_service.send_emails({ emails: [user.email], content });
    }

    const sid: string = await create_session({ user_id: user._id, ip }, this.options);
    const profile = {
      _id: user._id,
      email: user.email,
      username: user.username,
      email_verified: user.email_verified,
      role: user.role,
      img: user.img,
      premium: user.premium,
    };
    const signinResult = {
      user: profile,
      sid,
    };

    return signinResult;
  }

  async signout(credentials: any): Promise<void> {
    const { sid } = credentials;

    await this.auth_validator.signout(credentials);
    await this.options.redis.hDel('sessions', sid);
  }

  async verify_email(token: string): Promise<any> {
    await this.auth_validator.verify_email(token, this.options);

    const user: any = await this.collections.users.findOne({
      emailVerificationToken: token,
    });

    await this.collections.users.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpDate: null,
          updatedAt: new Date(),
        },
      },
    );

    const { email, username, role } = user;
    const profile = {
      _id: user._id,
      email,
      username,
      email_verified: true,
      role,
      img: user.img,
    };

    return profile;
  }

  async reset_password(credentials: any): Promise<any> {
    await this.auth_validator.reset_password(credentials, this.options);

    const { password, token } = credentials;
    const user: any = await this.collections.users.findOne({ password_reset_token: token });
    const user_id: string = user._id.toString();
    const redis = this.options.redis;

    await this.collections.users.updateOne(
      { password_reset_token: token },
      {
        $set: {
          password: Crypto.SHA256(password).toString(),
          passwordResetToken: null,
          passwordResetTokenExpDate: null,
          updatedAt: new Date(),
        },
      },
    );

    const sessions = await redis.hGetAll('sessions');

    for (const key in sessions) {
      if (sessions[key].includes(user_id)) {
        redis.hDel('sessions', key);
      }
    }

    const profile = {
      _id: user._id,
      email: user.email,
      username: user.username,
      email_verified: user.email_verified,
      role: user.role,
      img: user.img,
    };

    return profile;
  }

  async change_password(credentials: any): Promise<any> {
    await this.auth_validator.change_password(credentials, this.options);

    const { user, newPassword }: any = credentials;

    await this.collections.users.updateOne(
      { _id: user._id },
      {
        $set: {
          password: Crypto.SHA256(newPassword).toString(),
          updated_at: new Date(),
        },
      },
    );

    const profile = {
      _id: user._id,
      email: user.email,
      username: user.username,
      email_verified: user.email_verified,
      role: user.role,
      img: user.img,
    };

    return profile;
  }

  async reset_email(token: string): Promise<any> {
    await this.auth_validator.reset_email(token, this.options);
    const user: any = await this.collections.users.findOne({ email_reset_token: token });

    await this.collections.users.updateOne(
      { email_reset_token: token },
      {
        $set: {
          email: user.newEmail,
          email_reset_token: null,
          email_reset_token_exp_at: null,
          email_verified: true,
          updated_at: new Date(),
        },
      },
    );

    const profile = {
      _id: user._id,
      role: user.role,
      email: user.newEmail,
      username: user.username,
      email_verified: user.email_verified,
      img: user.img,
    };

    return profile;
  }
}

export default AuthService;
