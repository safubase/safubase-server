'use strict';

// MODULES
import axios from 'axios';
import Moralis from 'moralis';
import { EvmChain } from '@moralisweb3/common-evm-utils';

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

    //const url = 'https://dexcheck.io/unlocks/token_locks_combined?page=1';
    const url = 'https://token.unlocks.app';
    const res = await axios.get(url);

    console.log(res.data);

    return res.data;
  }

  async audit(credentials: any): Promise<void> {
    const result = await this.blockchain_validator.audit(credentials);

    let score: number = 0; // overall score for the current crypto
    let inc: number = 12.5; // score incrementer, calculate it by dividing 100 by the number of parameters of token
    let neutral: string = '';
    let warnings: string = '';
    let passed: string = '';

    /**
     *
     * IF blocks are positive for score ande ELSE blocks are for fails
     *
     */
    if (result.is_anti_whale === '1') {
      score = score + inc;
      passed = passed ? passed + '_Anti whale' : 'Anti Whale';
    } else {
      warnings = warnings ? warnings + '_No anti whale' : 'No anti whale';
    }

    if (result.is_blacklisted === '0') {
      score = score + inc;
      passed = passed ? passed + '_Not Blacklisted' : 'Not Blacklisted';
    } else {
      warnings = warnings ? warnings + '_Blacklisted' : 'Blacklisted';
    }

    if (result.is_honeypot === '0') {
      score = score + inc;
      passed = passed ? passed + '_Not honeypot' : 'Not honeypot';
    } else {
      warnings = warnings ? warnings + '_Honeypot' : 'Honeypot';
    }

    if (result.is_in_dex === '1') {
      score = score + inc;
      passed = passed ? passed + '_In DEX' : 'In DEX';
    } else {
      warnings = warnings ? warnings + '_Not in DEX' : 'Not in DEX';
    }

    if (result.is_mintable === '0') {
      score = score + inc;
      passed = passed ? passed + '_Not mintable' : 'Not mintable';
    } else {
      warnings = warnings ? warnings + '_Owner can mint the token' : 'Owner can mint the token';
    }

    if (result.is_open_source === '1') {
      score = score + inc;
      passed = passed ? passed + '_Open source' : 'Open source';
    } else {
      warnings = warnings ? warnings + '_Failed the some' : 'Failed the some';
    }

    if (result.is_proxy === '0') {
      score = score + inc;
      passed = passed ? passed + '_Not proxy' : 'Not proxy';
    } else {
      warnings = warnings ? warnings + '_Proxy' : 'Proxy';
    }

    if (result.is_whitelisted === '0') {
      score = score + inc;
      passed = passed ? passed + '_Not whitelisted' : 'Not whitelisted';
    } else {
      warnings = warnings ? warnings + '_Whitelisted' : 'Whitelisted';
    }

    result.chain_id = credentials.chain_id;
    result.score = score;
    result.neutral = neutral;
    result.warnings = warnings;
    result.passed = passed;
    result.created_at = new Date();

    /**
     *
     * MORALIS data
     *
     */
    const chains: any = { '56': EvmChain.BSC, '1': EvmChain.ETHEREUM };
    const api_res_moralis = await Moralis.EvmApi.token.getTokenMetadata({
      addresses: [credentials.address],
      chain: chains[credentials.chain_id],
    });
    const metadata: any = api_res_moralis.toJSON()[0];

    // Map all props and values of metadata to result
    for (const key in metadata) {
      result[key] = metadata[key];
    }

    // Override the moralis created_at
    result.created_at = new Date();

    /**
     *
     * REDIS section
     *
     **/
    const audits_hash: any = await this.options.redis.hGetAll('audits');
    const audits: any[] = [];

    for (const key in audits_hash) {
      audits.push(JSON.parse(audits_hash[key]));
    }

    for (let i: number = 0; i < audits.length; i++) {
      for (let j: number = 0; j < audits.length; j++) {
        if (audits[j + 1]) {
          const current = audits[j];
          const next = audits[j + 1];

          if (new Date(current.created_at).valueOf() < new Date(next.created_at).valueOf()) {
            audits[j] = next;
            audits[j + 1] = current;
          }
        }
      }
    }

    if (audits.length > 10) {
      audits.length = 10;

      for (const key in audits_hash) {
        await this.options.redis.hDel('audits', key);
      }

      for (let i: number = 0; i < audits.length; i++) {
        this.options.redis.hSet('audits', audits[i].address, JSON.stringify(audits[i]));
      }
    } else {
      await this.options.redis.hSet('audits', result.address, JSON.stringify(result));
    }

    return result;
  }

  async get_audits(credentials: any): Promise<object[]> {
    const audits_hash = await this.options.redis.hGetAll('audits');
    const audits = [];

    for (const key in audits_hash) {
      audits.push(JSON.parse(audits_hash[key]));
    }

    return audits;
  }
}

export default ServiceBlokchain;
