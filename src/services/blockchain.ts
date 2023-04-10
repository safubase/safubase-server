'use strict';

// MODULES
import Crypto from 'crypto-js';
import ImageKit from 'imagekit';
import validator from 'validator';
import axios from 'axios';
import Moralis from 'moralis';
import { EvmChain } from '@moralisweb3/common-evm-utils';

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

    Moralis.start({ apiKey: config.env.API_KEY_MORALIS });
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
    const chains: any = {
      '56': EvmChain.BSC,
      '1': EvmChain.ETHEREUM,
    };

    let score: number = 0; // overall score for the current crypto
    let inc: number = 12.5; // score incrementer
    let failed: string = '';
    let warnings: string = '';
    let passed: string = '';

    const api_res_moralis = await Moralis.EvmApi.token.getTokenMetadata({
      addresses: [credentials.address],
      chain: chains[credentials.chain_id],
    });

    console.log(api_res_moralis.toJSON());

    /**
     *
     * IF blocks are positive for score ande ELSE blocks are for fails
     *
     */
    if (result.is_anti_whale === '1') {
      score = score + inc;
    } else {
    }

    if (result.is_blacklisted === '0') {
      score = score + inc;
    } else {
    }

    if (result.is_honeypot === '0') {
      score = score + inc;
    } else {
    }

    if (result.is_in_dex === '1') {
      score = score + inc;
    } else {
    }

    if (result.is_mintable === '0') {
      score = score + inc;
    } else {
    }

    if (result.is_open_source === '1') {
      score = score + inc;
    } else {
    }

    if (result.is_proxy === '0') {
      score = score + inc;
    } else {
    }

    if (result.is_whitelisted === '0') {
      score = score + inc;
    } else {
    }

    result.score = score;
    result.failed = failed;
    result.warnings = warnings;
    result.passed = passed;

    return result;
  }

  async get_audits(credentials: any): Promise<void> {}
}

export default ServiceBlokchain;
