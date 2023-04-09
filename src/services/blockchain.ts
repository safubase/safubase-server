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
import UTILS_SERVICES from '../utils/services';

class ServiceBlokchain {
  private options: any;
  private collections: any;
  private blockchain_validator: any;
  private imagekit: any;

  constructor(options: any) {
    this.options = options;
    this.collections = options.collections;
    this.blockchain_validator = new UTILS_SERVICES.BlockchainValidator(options);
  }

  async get_whales(credentials: any) {
    await this.blockchain_validator.get_whales(credentials);

    const api_match: any = { avalanche: 'avax', fantom: 'ftm', arbitrum: 'arb', polygon: 'poly', bsc: 'bsc', eth: 'eth' };
    const url = 'https://dexcheck.io/' + api_match[credentials.chain.toLowerCase()] + '-api/whale_watcher?amount_min=10000&chain=' + credentials.chain.toLowerCase() + '&exclude_stable=true&size=20&exclude_bots=0&page=1';
    const res = await axios.get(url);

    return res.data.trs;
  }

  async get_upcoming_unlocks(credentials: any) {
    await this.blockchain_validator.get_upcoming_unlocks(credentials);

    const url = 'https://dexcheck.io/unlocks/token_locks_combined?page=1';
    const res = await axios.get(url);

    return res.data;
  }

  async audit(credentials: any): Promise<void> {
    const result = await this.blockchain_validator.audit(credentials);
    let score: number = 0; // overall score for the current crypto
    let inc: number = 12.5; // score incrementer
    let failed: string = "";
    let warnings: string = "";
    let passed: string = "";

    /**
     * 
     * IF blocks are positive for score ande ELSE blocks are for fails
     * 
     */
    if (result.is_anti_whale === "1") {
      score = score + inc;
    } else {

    }

    if (result.is_blacklisted === "0") {
      score = score + inc;
    } else {

    }

    if (result.is_honeypot === "0") {
      score = score + inc;
    } else {

    }

    if (result.is_in_dex === "1") {
      score = score + inc;
    } else {

    }

    if (result.is_mintable === "0") {
      score = score + inc;
    } else {

    }

    if (result.is_open_source === "1") {
      score = score + inc;
    } else {

    }

    if (result.is_proxy === "0") {
      score = score + inc;
    } else {

    }

    if (result.is_whitelisted === "0") {
      score = score + inc;
    } else {

    }

    result.score = score;

    return result;
  }
}

export default ServiceBlokchain;
