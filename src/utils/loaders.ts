'use strict';

// MODULES
import ImageKit from 'imagekit';

// INTERFACES
import { Document } from 'mongodb';
import { FileObject, ListFileResponse } from 'imagekit/dist/libs/interfaces';
import IOptions from 'interfaces/common';

// CONFIG
import config from '../config';

export async function check_admins(options: IOptions): Promise<void> {
  const squery: object = { role: config.roles.admin, permission: config.permissions.admin };

  try {
    const admins: Document[] = await options.collections.users.find(squery).toArray();

    for (let i: number = 0; i < admins.length; i++) {
      for (let j: number = 0; j < admins.length; j++) {
        if (admins[j + 1]) {
          const current: Document = admins[j];
          const next: Document = admins[j + 1];

          if (current.created_at.valueOf() > next.created_at.valueOf()) {
            admins[j] = next;
            admins[j + 1] = current;
          }
        }
      }
    }

    if (admins.length > 1) {
      for (let i: number = 1; i < admins.length; i++) {
        options.collections.users.updateOne(
          { _id: admins[i]._id },
          {
            $set: {
              role: config.roles.user,
              permission: config.permissions.user,
            },
          },
        );
      }
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

    const expire_at: number = Number(created_at) + config.env.SESSION_LIFETIME;

    if (expire_at < Date.now()) {
      options.redis.hDel('sessions', key);
    }
  }
}

export default {
  check_admins,
  clear_imagekit,
  clear_sessions,
};
