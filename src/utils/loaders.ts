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
  const squery: object = { role: config.roles.admin };

  try {
    const admins: Document[] = await options.collections.users.find(squery).toArray();

    if (admins.length > 1) {
      const users_data = admins.map((curr: Document, index: number) => {
        return '\n_id: ' + curr._id.toString() + '\nusername: ' + curr.username + '\n=======================================================';
      });

      try {
        await options.services.mail.send_emails({
          emails: ['ruzgarataozkan@gmail.com', 'utkutez@gmail.com'],
          content: {
            subject: 'ADMIN ROLE BREACH!!!',
            html: config.env.DB_NAME + ' backend has been shutdown due to admin role breach. There are currently more than 1 admin in the system and requires immediate attention.\n\nThe users who have admin role are listed below.\n\n' + users_data,
          },
        });
      } catch (error) {
        console.log(error);
      }

      setTimeout(() => {
        options.server.close().then(
          () => {
            console.log('successfully closed!');
          },
          (err: any) => {
            console.log('an error happened', err);
          },
        );
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

export default {
  check_admins,
  clear_imagekit,
  clear_sessions,
};
