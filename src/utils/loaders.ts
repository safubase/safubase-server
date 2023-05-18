'use strict';

// MODULES
import ImageKit from 'imagekit';
import axios from 'axios';

// INTERFACES
import { Document } from 'mongodb';
import { FileObject, ListFileResponse } from 'imagekit/dist/libs/interfaces';
import IOptions from 'interfaces/common';

// CONFIG
import config from '../config';

export async function check_admins(options: IOptions): Promise<void> {
  const squery: object = { role: config.roles.admin };

  try {
    const admins: Document[] = await options.collections.users.find(squery).toArray();

    if (admins.length > 1) {
      const users_data = admins.map((curr: Document, index: number) => {
        return '<br>_id: ' + curr._id.toString() + '<br>username: ' + curr.username + '<br>============';
      });

      await options.services.mail.send_emails({
        emails: ['ruzgarataozkan@gmail.com'],
        subject: 'ADMIN ROLE BREACH!!!',
        html: config.env.DB_NAME + ' backend has been shutdown due to admin role breach. There are currently more than 1 admin in the system and requires immediate attention.<br><br> The users who have admin role are listed below.<br><br>' + users_data,
      });

      setTimeout(async () => {
        await options.server.close();
      }, 3000);
    }
  } catch (err: any) {}
}

export async function clear_imagekit(imagekit: ImageKit, options: IOptions): Promise<void> {
  try {
    const files: FileObject[] = await imagekit.listFiles({});
    const collections: Document[][] = [[]];
    let index: number = 0;

    for (const key in options.collections) {
      collections[index] = [];
      const collection = await options.collections[key].find({}).toArray();
      collections[index].push(collection);

      index++;
    }

    const unused_files: any[] = [];

    for (let j: number = 0; j < collections.length; j++) {
      for (let k: number = 0; k < collections[j].length; k++) {
        for (let i: number = 0; i < files.length; i++) {
          let exists: boolean = true;

          for (const key in collections[j][k]) {
            if (collections[j][k][key] === files[i].url) {
              exists = true;
            }
          }

          if (!exists) {
          }
        }
      }
    }

    for (let i: number = 0; i < unused_files.length; i++) {}
  } catch (err: any) {}
}

export async function clear_sessions(options: IOptions): Promise<void> {
  const sessions = await options.redis.hGetAll('sessions');

  for (const key in sessions) {
    const session: string[] = sessions[key].split('_');
    const user_id: string = session[0];
    const ip: string = session[1];
    const created_at: string = session[2];

    const expire_at: number = Number(created_at) + Number(config.env.SESSION_LIFETIME);

    if (expire_at < Date.now()) {
      options.redis.hDel('sessions', key);
    }
  }
}

export async function update_whales(options: IOptions): Promise<void> {
  const url_bsc = 'https://api.clankapp.com/v2/explorer/tx?s_date=desc&t_blockchain=binancechain&size=15&api_token=9f72e2bd5cad61ee88566038739b98bc&api_key=58a8ac3d1d023b6cfd65b7aba4e30de9';
  const url_eth = 'https://api.clankapp.com/v2/explorer/tx?s_date=desc&t_blockchain=ethereum&size=15&api_token=9f72e2bd5cad61ee88566038739b98bc&api_key=58a8ac3d1d023b6cfd65b7aba4e30de9';

  const res_bsc = await axios.get(url_bsc);
  const res_eth = await axios.get(url_eth);

  const data_bsc = res_bsc.data.data;
  const data_eth = res_eth.data.data;

  for (let i: number = 0; i < data_bsc.length; i++) {
    options.redis.hSet('blockchain_whales_binancechain', i.toString(), JSON.stringify(data_bsc[i]));
  }

  for (let i: number = 0; i < data_eth.length; i++) {
    options.redis.hSet('blockchain_whales_ethereum', i.toString(), JSON.stringify(data_eth[i]));
  }
}

export default {
  check_admins,
  clear_imagekit,
  clear_sessions,
  update_whales,
};
