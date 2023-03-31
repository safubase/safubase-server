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
import UTILS_SERVICES from '../utils/services';
import UTILS_COMMON from '../utils/common';

class AuthService {
  private options: any;
  private collections: any;
  private auth_validator: any;
  private imagekit: any;

  constructor(options: any) {
    this.options = options;
    this.collections = options.collections;
    this.auth_validator = new UTILS_SERVICES.AuthValidator(options);
    this.imagekit = new ImageKit({
      publicKey: config.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: config.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: `https://ik.imagekit.io/${config.env.IMAGEKIT_ID}/`,
    });
  }

  async get_profile(credentials: any): Promise<any | null> {
    if (!credentials.sid) {
      return null;
    }

    const session: string | null = await this.options.redis.hGet('sessions', credentials.sid);

    if (!session) {
      return null;
    }

    const sparts: string[] = session.split('_');
    const user_id: string = sparts[0];
    const ip: string = sparts[1];
    const time: string = sparts[2];

    if (Number(time) + config.env.SESSION_LIFETIME_MS < Date.now()) {
      return null;
    }

    if (ip !== credentials.ip) {
      return null;
    }

    const user: Document = await this.options.collections.users.findOne({ _id: new ObjectId(user_id) });

    if (!user) {
      return null;
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

  async edit_profile(credentials: any): Promise<any> {
    await this.auth_validator.edit_profile(credentials, this.options);

    let imagekit_url: string = '';

    if (credentials.img_base64) {
      const base64_buffer: string[] = credentials.img_base64.split(';base64,');
      const base64_type: string = base64_buffer[0];
      const base64_data: string = base64_buffer[1];

      const file_ext: string = base64_type.split('/')[1];
      const file_name: string = Crypto.lib.WordArray.random(32).toString() + '.' + file_ext;

      const imagekit_res: UploadResponse = await this.imagekit.upload({ file: base64_data, fileName: file_name });

      imagekit_url = imagekit_res.url;
    }

    // update user credentials
    await this.collections.users.updateOne(
      { _id: credentials.user._id },
      {
        $set: {
          username: UTILS_COMMON.str_remove_extra_space(credentials.username).toLowerCase(),
          username_changed_at: credentials.username !== credentials.user.username ? new Date() : credentials.user.username_changed_at,
          img: imagekit_url ? imagekit_url : credentials.user.img,
        },
      },
    );

    // create client user to send it back to client to see the updated values.
    const profile = {
      _id: credentials.user._id,
      email: credentials.user.email,
      username: credentials.username,
      email_verified: credentials.user.email_verified,
      role: credentials.user.role,
      img: credentials.user.img,
    };

    return profile;
  }

  async signup(credentials: any): Promise<any> {
    await this.auth_validator.signup(credentials, this.options);

    const doc = await UTILS_SERVICES.create_user_doc(credentials, this.options);
    const insert_one_result: InsertOneResult = await this.collections.users.insertOne(doc);
    const sid: string = await UTILS_SERVICES.create_session({ user_id: insert_one_result.insertedId.toString(), ip: credentials.ip }, this.options);
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
    /**
     *     
     * 
      const premium: Document | null = await this.collections.premiums.findOne({ user_id: user._id });

      if (premium && premium.exp_at.valueOf() > new Date().valueOf() && premium.status === 2) {
        user.premium = true;
      }
     * 
     */

    if (credentials.ip !== user.last_ip && validator.isIP(user.last_ip) && user.last_ip) {
      const content = {
        subject: `New Login to ${config.env.URL_UI} from:` + credentials.ip,
        html: UTILS_SERVICES.generate_html('new-ip', { username: user.username, ip: credentials.ip }),
      };

      this.options.services.mail.send_emails({ emails: [user.email], content });
    }

    const sid: string = await UTILS_SERVICES.create_session({ user_id: user._id, ip: credentials.ip }, this.options);
    const profile = {
      _id: user._id,
      email: user.email,
      username: user.username,
      email_verified: user.email_verified,
      role: user.role,
      img: user.img,
      //premium: user.premium,
    };

    const result = { user: profile, sid };

    return result;
  }

  async signout(credentials: any): Promise<void> {
    await this.auth_validator.signout(credentials);
    await this.options.redis.hDel('sessions', credentials.sid);
  }

  async verify_email(token: string): Promise<any> {
    const user = await this.auth_validator.verify_email(token, this.options);

    await this.collections.users.updateOne(
      { _id: user._id },
      {
        $set: {
          email_verified: true,
          email_verification_token: null,
          email_verification_token_exp_at: null,
          updated_at: new Date(),
        },
      },
    );

    const profile = {
      _id: user._id,
      email: user.email,
      username: user.username,
      email_verified: true,
      role: user.role,
      img: user.img,
    };

    return profile;
  }

  async reset_password(credentials: any): Promise<any> {
    await this.auth_validator.reset_password(credentials, this.options);

    const user: any = await this.collections.users.findOne({ password_reset_token: credentials.token });

    await this.collections.users.updateOne(
      { password_reset_token: credentials.token },
      {
        $set: {
          password: Crypto.SHA256(credentials.password).toString(),
          password_reset_token: null,
          password_reset_token_exp_at: null,
          updated_at: new Date(),
        },
      },
    );

    const sessions = await this.options.redis.hGetAll('sessions');

    for (const key in sessions) {
      if (sessions[key].includes(user._id.toString())) {
        this.options.redis.hDel('sessions', key);
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

    await this.collections.users.updateOne(
      { _id: credentials.user._id },
      {
        $set: {
          password: Crypto.SHA256(credentials.new_password).toString(),
          updated_at: new Date(),
        },
      },
    );

    const profile = {
      _id: credentials.user._id,
      email: credentials.user.email,
      username: credentials.user.username,
      email_verified: credentials.user.email_verified,
      role: credentials.user.role,
      img: credentials.user.img,
    };

    return profile;
  }

  async reset_email(credentials: any): Promise<any> {
    await this.auth_validator.reset_email(credentials, this.options);

    const email_verification_token: string = await UTILS_SERVICES.generate_email_verification_token(this.options);

    await this.collections.users.updateOne(
      { _id: credentials.user._id },
      {
        $set: {
          email: credentials.email,
          email_verification_token: email_verification_token,
          email_verification_token_exp_at: new Date(Date.now() + config.times.one_hour_ms * 24),
          email_verified: false,
          updated_at: new Date(),
        },
      },
    );

    await this.options.services.mail.send_verification_link({
      email: credentials.email,
      token: email_verification_token,
    });

    const profile = {
      _id: credentials.user._id,
      role: credentials.user.role,
      email: credentials.email,
      username: credentials.user.username,
      email_verified: false,
      img: credentials.user.img,
    };

    return profile;
  }
}

export default AuthService;
