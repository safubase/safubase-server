'use strict';

// MODULES
import { CronJob } from 'cron';
import ImageKit from 'imagekit';
import axios from 'axios';

// CONFIG
import config from '../config';

// UTILS
import { clear_sessions, clear_imagekit } from '../utils/loaders';

async function load_cron(options: any): Promise<void> {
  if (!options) {
    throw new Error('Too few arguments specified in loadCronJobs');
  }

  const imagekit = new ImageKit({
    publicKey: config.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: config.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: `https://ik.imagekit.io/${config.env.IMAGEKIT_ID}/`,
  });

  axios
    .get('https://dexcheck.io/eth-api/whale_watcher?amount_min=10000&chain=bsc&exclude_stable=true&size=20&exclude_bots=0&page=1')
    .then((res) => {
      console.log(res.data.trs);
    })
    .catch((err) => {
      console.log(err);
    });

  // Every midnight
  new CronJob('00 00 00 * * *', function () {
    clear_sessions(options);
    clear_imagekit(imagekit, options);
  }).start();
}

export default load_cron;
