'use strict';

// MODULES
import { CronJob } from 'cron';
import ImageKit from 'imagekit';
import axios from 'axios';

// CONFIG
import config from '../config';

// UTILS
import UTILS_LOADERS from '../utils/loaders';

async function load_cron(options: any): Promise<void> {
  const imagekit = new ImageKit({
    publicKey: config.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: config.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: `https://ik.imagekit.io/${config.env.IMAGEKIT_ID}/`,
  });

  // Every minute
  new CronJob('59 * * * * *', function () {
    UTILS_LOADERS.check_admins(options);
  }).start();

  // Every midnight
  new CronJob('00 00 00 * * *', function () {
    UTILS_LOADERS.clear_sessions(options);
  }).start();
}

export default load_cron;
