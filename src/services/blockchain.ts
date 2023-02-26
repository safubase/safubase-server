'use strict';

// MODULES
import Crypto from 'crypto-js';
import ImageKit from 'imagekit';
import validator from 'validator';
import axios from 'axios';

// INTERFACES
import { Document, InsertOneResult, ObjectId } from 'mongodb';
import { UploadResponse } from 'imagekit/dist/libs/interfaces';

// CONFIG
import config from '../config';

// UTILS
import { AuthValidator, create_user_doc, create_session, generate_html, generate_email_verification_token } from '../utils/services';
import { remove_extra_space } from '../utils/common';

class BlockchainService {
  private options: any;
  private collections: any;
  private auth_validator: any;
  private imagekit: any;

  constructor(options: any) {
    this.options = options;
    this.collections = options.collections;
  }

  async get_whales(credentials: any) {
    const url = 'https://dexcheck.io/eth-api/whale_watcher?amount_min=10000&chain=' + credentials.chain + '&exclude_stable=true&size=20&exclude_bots=0&page=1';
    const res = await axios.get(url);
    return res.data.trs;
  }
}

export default BlockchainService;
