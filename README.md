# Installation

```bash
$ git clone https://github.com/RuzgarAtaOzkan/server.git
$ cd ./server
$ npm install
```

Then create a .env file in the root of the project and enter your environment values.

```.env
PORT=

NODE_ENV=development | production

SESSION_SECRET=
SESSION_LIFETIME=
SESSION_NAME=

DB_CONNECTION_STRING=

GMAIL_PASSWORD=
```

Run start first to create the db collections then run your tests.

```bash
$ npm run start
$ npm run test
```

# Documentation

All the pipelines are documented from entry point to exit of the program.
Numbers in the titles represents the order of the pipelines and it goes in order.

## 1. Config Object

### Path: src/config/index.ts

First we need to take a look at the configuration object for our application to configure everything in our application
for robust and static design.

Here this is what the config object looks like.

```javascript
'use strict';

// CONFIGURATION VALUES

// INTERFACES
import IConfig, { IDBCollections } from '../interfaces/config';

// MODULES
const dotenv = require('dotenv');

// Bind .env file to the process.env;
const envFound = dotenv.config();

if (envFound.error) {
  // This error should crash whole process
  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

// ENVIRONMENT VARIABLES
const {
  PORT,
  NODE_ENV = 'development', // TODO Make Node environment production
  SESSION_SECRET,
  SESSION_LIFETIME,
  SESSION_NAME = 'session_id',
  DB_CONNECTION_STRING,
  DB_NAME = 'sahiltepe',
  GMAIL_PASSWORD,
} = process.env;

const times = {
  oneMinInMilliseconds: 1000 * 60,
  oneHourInMilliseconds: 1000 * 60 * 60,
  oneHourInSeconds: 3600,
};

const DB_COLLECTIONS: IDBCollections = {
  users: { title: 'users' },
  sessions: { title: 'sessions' },
  votes: { title: 'votes' },
};

const config: IConfig = {
  environment: {
    PORT: Number(PORT),
    NODE_ENV,
    SESSION_SECRET,
    SESSION_LIFETIME: Number(times.oneHourInMilliseconds * 3),
    SESSION_NAME,
    DB_CONNECTION_STRING,
    DB_NAME,
    DB_COLLECTIONS,
    GMAIL_PASSWORD,
  },
  // .environments is OBSOLETE, will be removed in the future
  environments: {
    PORT: Number(PORT),
    NODE_ENV,
    SESSION_SECRET,
    SESSION_LIFETIME: Number(SESSION_LIFETIME),
    SESSION_NAME,
    DB_CONNECTION_STRING,
    DB_NAME,
    DB_COLLECTIONS,
    GMAIL_PASSWORD,
  },
  // User roles
  roles: {
    admin: {
      title: 'admin',
      permission: '2f7293f6-0513-4b28-9818-010dde5af1e7',
    },
    executive: {
      title: 'executive',
      permission: '15494b7e-17a8-463b-9d07-2422a8720457',
    },
    user: {
      title: 'user',
      permission: '55eca49e-fc6d-47bf-b692-d89066863e75',
    },
  },

  times,

  votes: {
    vote: 1,
    oneVote: 1,
    defaultVoteOptions: ['evet', 'hayir', 'cekimser'],
  },
  // Logs data
  logs: {
    level: 'info',
  },
  dev: {
    dataTypes: {
      objectId: 'objectId',
      string: 'string',
      number: 'number',
      float: 'float',
      double: 'double',
      boolean: 'boolean',
      null: 'null',
      undefined: 'undefined',
      object: 'object',
      array: 'array',
      function: 'function',
      bool: 'bool',
      int: 'int',
    },
  },
  api: {
    endpoints: {
      root: '/',
      auth: {
        signin: '/signin',
        signup: '/signup',
        emailVerification: '/auth/verification/email/:verificationToken',
        passwordDecryption: '/password/:type/:token',
      },
    },
    versions: {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      first: 1,
      second: 2,
      third: 3,
      fourth: 4,
    },
    methods: {
      get: 'GET',
      post: 'POST',
      put: 'PUT',
      delete: 'DELETE',
      GET: 'GET',
      POST: 'POST',
      PUT: 'PUT',
      DELETE: 'DELETE',
    },
    statusCodes: {
      OK: 200,
    },
  },
};

module.exports = config;
```

## 2. Entry Point of the Application

### Path: src/index.ts

Entry point of the program, this is where we import the index loader which is loadServer at this situation.

loadServer promise loads all the loader functions in the loaders folder, at this situation it does two mendatory things:

- Generates a database with the given configurations such as desired collections and returns a Mongo Client instance.
- Generates a fastify application with the given configurations and takes that Mongo Client instance generated right before and pass it on the loadFastify function as argument, then returns the configured fastify application as seen in the below.

There will be detailed explanation about the loaders in the next section (3. src/loaders/).

Then we start to listen on any port we want with the fastify application.

Here this is what the src/index.ts file looks like.

```javascript
'use strict';

// ENTRY POINT OF THE PROGRAM.

// MODULES
const fastify = require('fastify');

// CONFIG
const config = require('./config/index');

// LOADERS
const loadServer = require('./loaders'); // loads the whole fastify application.

async function startServer(): Promise<typeof fastify> {
  const PORT: number = config.environment.PORT;

  try {
    // loadServer returns an fastify application server object which we can listen the port we want.
    const server: typeof fastify = await loadServer(); // typeof fastify because fastify doesn't have types for typescript yet as far as I know.

    await server.listen(PORT);

    Logger.info(`🛡️ Server listening on port: ${PORT} 🛡️`);

    return server;
  } catch (error) {
    process.exit(1);
  }
}

startServer();
```

## 3. Index Loader (loadServer)

### Path: src/loaders/index.ts

Loaders are just function calls to create and configure instances such as creating fastify instance
and Mongo Client instance. We use loaders to create a robust design pattern and good folder structure
to keep the code well organized rather then creating fastify and Mongo Client in src/index.ts (entry point of the program).

We load every big model in loaders.

We load them in to the -> src/index.ts, as the name calls (loader) :)

The index loader is just a function which executes all the loaders in it and returns a
configured fastify instance. Every functionality of the application, every api route, every database
collections are being generated here.

Content of the index loader file. We provide the mongodb connection string to connect to a mongodb atlas
database from our node application then pass it on the loadMongodb function to generate the desired database.

loadMongodb function returns a Mongo Client instance which we will pass it as argument throughout the whole application.

<b>Note:</b> You will see Mongo Client instance (mongoClient) in almost anywhere as a dependency injection.

Then loadFastify function takes the Mongo Client instance as argument then makes the fastify application
configurations along with the mongoClient object, then returns a fastify application. Every api route and
middlewares ex. generated from loadFastify.

This is how the loadServer (index loader) function looks like.

```javascript
'use strict';

// INTERFACES
import IConfig from 'interfaces/config';

// MODULES
const { MongoClient } = require('mongodb');
const fastify = require('fastify');

// LOADERS
const loadFastify = require('./fastify');
const loadMongodb = require('./mongodb');

// CONFIG
const config: IConfig = require('../config');

async function loadServer(): Promise<typeof fastify> {
  const { DB_CONNECTION_STRING } = config.environment;

  try {
    // Provides the database connection and returns the client of the mongodb driver.
    const mongoClient: typeof MongoClient = await loadMongodb(DB_CONNECTION_STRING);

    // We get the mongo client to pass in the fastify application loader to use in the routes
    // Load the Fastify App with the configured mongo client.
    const server: typeof fastify = await loadFastify(mongoClient);

    return server;
  } catch (err) {
    throw err;
  }
}

module.exports = loadServer;
```

## 4. Mongodb Loader

### Path: /src/loaders/mongodb.ts

Mongodb loader just generates the desired collections with the given schema configurations and returns a Mongo Client instance.

As we said in the previous the first argument is the connection string for our desired mongodb atlas database.

There will be detailed explanation about schemas in the next section.

Here is how the mongodb loader function looks like.

```javascript
'use strict';

// INTERFACES
import IConfig from 'interfaces/config';
import { ISchema } from 'interfaces/loaders/mongodb';

// MODULES
const { MongoClient, Collection } = require('mongodb');

// LOADERS
const Logger = require('../loaders/logger');

// MODELS
const models = require('../models');

// CONFIG
const config: IConfig = require('../config');

// loadMongodb is the main function of this file,
// every configuration is being created here.
// cs stands for connection string
async function loadMongodb(cs: string): Promise<typeof MongoClient> {
  // Create a new MongoClient
  const client = new MongoClient(cs, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // schemas which we want to create as a collection in mongodb cluster.
  const userSchema: ISchema = models.user;
  const voteSchema: ISchema = models.vote;
  const sessionSchema: ISchema = models.session;

  const schemas: ISchema[] = [userSchema, voteSchema, sessionSchema];

  try {
    await client.connect();

    // Creates all the collections with the given schemas.
    await createCollections(schemas, client);

    return client;
  } catch (err) {
    throw err;
  }
}
```

Create Collections

The function takes schemas as the first argument and creates a collection for each one of them
with their name spaces (schema.name) and takes the Mongo Client instance as the second argument as the rest of the application will be.

The function returns an array of created Collections from the schemas,
for the sake of the well organized code we seperated collection creation in another function called createCollection.

<b>Note:</b> Do not forget that createCollections and createCollection are different functions.

createCollection is an async function that takes the current schema as the first argument and Mongo Client instance as
the second and returns a Promise which resolves a created Collection.
We store its promise value without the await keyword to prevent the waiting for each collection creation
then we resolve all the promises at once for efficieny with Promise.all() function as seen in belov.

There will be detailed explanation about schemas in the next section.

This is what the createCollections function looks like.

```javascript
// createCollections function is responsible for starting
// createCollection functions, it is just for clean code.
async function createCollections(schemas: ISchema[], client: typeof MongoClient): Promise<typeof Collection[]> {
  if (!client) {
    throw new Error('Client hasnt provided in createCollections function, loaders > mongodb.js');
  }

  const collectionCreationPromises: Promise<typeof Collection>[] = [];

  for (const schema of schemas) {
    // ccp stands for collection creation promise.

    // createCollection is an async function, instead of awaiting its resolved result, we are
    // storing its return value which is an unresolved promise in an array then we
    // resolving them all at once for efficiency and performance with the Promise.all() function.

    // Check it, there is no await keyword belov before createCollection
    const ccp: Promise<typeof Collection> = createCollection(schema, client);
    collectionCreationPromises.push(ccp);
  }

  try {
    const result: typeof Collection[] = await Promise.all(collectionCreationPromises);

    return result;
  } catch (err) {
    throw err;
  }
}

module.exports = loadMongodb;
```

Create Collection

This is where a schema is being used to create a collection with the Mongodb driver.

We first check if there are any collection exists with the same name, if so we return null before the collection creation.

The schema values are being passed to db.createCollection function then we make the other configurations
such as unique indexes like email and username.

Then we return the result which is the created collection.

There will be detailed explanation about schemas in the next section.

```javascript
// createCollection function is responsible for creating the desired collection
// with the configuration of given arguments like collection schema and name.
// createCollections returns the generated collection.
async function createCollection(schema: ISchema, client: typeof MongoClient): Promise<typeof Collection | null> {
  // createCollection will return a promise , createCollection and createCollections are different things

  if (!schema || !client) {
    throw new Error('Too few arguments for createCollection.js');
  }

  const { DB_NAME } = config.environment;
  const db = await client.db(DB_NAME);

  try {
    // Listing all the collections in the database and convert them to array
    // to check if there is any conflict on collection names.
    const collectionsCursor = await db.listCollections({});
    const collections = await collectionsCursor.toArray();

    //console.log(collections);

    // If the parameter coolectionName (name) is included in the database then that means
    // desired collection is already exists in the database
    // return null to check later in the createCollections before putting into Promise.all();
    const existingCollection: typeof Collection = collections.find((collection: any) => collection.name === schema.name);

    if (existingCollection) {
      return null;
    }

    // Where the magic happens.
    // Creation of schemas and configurations in database. returns a collection
    const result: typeof Collection = await db.createCollection(schema.name, {
      validator: {
        $jsonSchema: {
          bsonType: schema.bsonType,
          required: schema.required,
          properties: schema.properties,
        },
      },
    });

    // for storing promises we create from the unique props individually;
    const uniquePropPromises = [];

    // unique values we collect from the schema is used for creating unique indexes.
    for (const propName of schema.uniqueProps) {
      /*
        const uniqueProp: any = {};
        uniqueProp[propName] = 1;
        const promise: Promise<typeof Collection> = db.collection(schema.name).createIndex(uniqueProp, { unique: true });
      */
      const promise: Promise<typeof Collection> = db.collection(schema.name).createIndex({ [propName]: 1 }, { unique: true });
      uniquePropPromises.push(promise);
    }

    await Promise.all(uniquePropPromises);

    return result;
  } catch (err) {
    throw err;
  }
}
```

## 5. Schema Models

### Path: src/models/

This is where we define all our Mongodb models to create the desired collections out of them like we shown in the previous section.

Schema object is just an object that provide the needs of a Mongo Client instance to create a collection.

We create a collection for each model in the database and every schema has a name and properties.

<b>Note:</b> as we do not use a third party library such as "mongoose" to create and interact with mongodb driver, we have to
specify our schema models according to mongodb driver itself.

Here this is what a schema model looks like.

Path: src/models/user.ts

```javascript
'use strict';

// INTERFACES
import IUserSchema from '../interfaces/models/user';

// CONFIG
const config = require('../config');

const { DB_COLLECTIONS } = config.environment;

const { dataTypes } = config.dev;

const schema: IUserSchema = {
  name: DB_COLLECTIONS.users.title,
  bsonType: dataTypes.object,
  required: [],
  uniqueProps: ['username', 'email'],
  properties: {
    username: {
      bsonType: dataTypes.string,
    },
    email: {
      bsonType: dataTypes.string,
    },
    password: {
      bsonType: dataTypes.string,
    },
    emailVerified: {
      bsonType: [dataTypes.bool, dataTypes.null],
    },
    emailVerificationToken: {
      bsonType: [dataTypes.string, dataTypes.null],
    },
    emailVerificationTokenExpDate: {
      bsonType: [dataTypes.double, dataTypes.number, dataTypes.null],
    },
    emailResetToken: {
      bsonType: [dataTypes.string, dataTypes.null],
    },
    emailResetTokenExpDate: {
      bsonType: [dataTypes.double, dataTypes.number, dataTypes.null],
    },
    passwordResetToken: {
      bsonType: [dataTypes.string, dataTypes.null],
    },
    passwordResetTokenExpDate: {
      bsonType: [dataTypes.double, dataTypes.number, dataTypes.null],
    },
    sessionId: {
      bsonType: [dataTypes.string, dataTypes.null],
    },
    active: {
      bsonType: [dataTypes.bool, dataTypes.null],
    },
    address: {
      bsonType: [dataTypes.string, dataTypes.null],
    },
    role: {
      enum: [config.roles.admin.title, config.roles.executive.title, config.roles.user.title], // TODO config roles props made object  add .title at the end
    },
    permission: {
      enum: [config.roles.user.permission, config.roles.executive.permission, config.roles.admin.permission],
    },
    votes: {
      bsonType: [dataTypes.array, dataTypes.null],
      items: {
        bsonType: dataTypes.object,
        required: ['voteId', 'option'],
        properties: {
          voteId: {
            bsonType: dataTypes.objectId,
          },
          option: {
            bsonType: dataTypes.string,
          },
        },
      },
    },
    createdAt: {
      bsonType: [dataTypes.double, dataTypes.number, dataTypes.null],
    },
    updatedAt: {
      bsonType: [dataTypes.double, dataTypes.number, dataTypes.null],
    },
  },
};

for (const propName in schema.properties) {
  schema.required.push(propName);
}

module.exports = schema;
```

Notice the name, bsonType and properties? We used them in the previous section which is the mongodb
loader to create the user collection from these values.

You see every property in properties is an object that has the bsonType property which takes a string, this is how we determine which data type
the attribute should have in the mongo database. We can give multiple values with an array, in this situation we gave almost
all of them the null data type as the second data type value.

You see dataTypes object which comes from config object, ther are just the data types which represented in string
to prevent the string mistakes and keep the corporate code. We use dataTypes object almost anywhere in the program.

e.g.

```javascript
if (typeof password !== dataTypes.string) {
  /* some code */
}
```

## 6. Fastify Loader

### Path: src/loaders/fastify.ts

We configured the Mongo Client and got the instance from the mongodb loader in the 4. section. Now we need
the Mongo Client instance to interact with the database so we passed the client instance to loadFastify function
in the index loader.

Now we can use the Mongo Client instance while making the fastify configurations.

loadFastify returns a fastify instance after done making all the api configurations.

Here this is what the fastify loaders looks like.

```javascript
'use strict';

import IConfig from 'interfaces/config';

// MODULES
const { MongoClient } = require('mongodb');
const fastify = require('fastify');
const fastifyCookie = require('fastify-cookie');
const cors = require('cors');

// LOADERS
const Logger = require('./logger');

// middie is a middleware engine for fastify.
const middie = require('middie');

// ROUTES
const bindAPIRoutes = require('../api'); // config api method allows us to place objects and dependencies like mongoClient vb.

// CONFIG
const config: IConfig = require('../config');

async function loadFastify(mongoClient: typeof MongoClient, options: any): Promise<typeof fastify> {
  // we pass the mongoClient object to config api method to pass it to routes
  if (!mongoClient) {
    throw new Error('MongoClient is missing in /loaders/express.js');
  }

  const { SESSION_SECRET } = config.environment;

  // Whole fastify application
  const server: typeof fastify = fastify({
    logger: options ? options.logger : false,
    maxParamLength: 256,
  });

  try {
    // Cross Origin Resource Sharing is enable to all origins by default.
    // Dream for frontend developers.

    // fastify middleware plugin registrations
    await server.register(middie);
    await server.register(fastifyCookie, {
      secret: SESSION_SECRET,
      parseOptions: {},
    });

    server.use(cors());

    // Load API routes and config mongo client by passing as argument
    // v1 API;

    // We pass the fastify & mongoClient to the bindAPIRoutes to bind the api routes to the fastify application.
    bindAPIRoutes(server, mongoClient);

    if (options && options.testing) {
    } else {
      Logger.info('Fastify loaded...');
    }

    return server;
  } catch (err) {
    //fastify.log.error(err);
    throw err;
  }
}

module.exports = loadFastify;
```

You see we just create a fastify instance which is the server in this siutatin with some configuration values like "maxParamLength"
and then we register some middlewares like cors and fastifyCookie, then we bind and configure all the api routes to server instance.

There will be detailed explanation about bindAPIRoutes in the next section.

We return the fastify instance (server) then we use that server instance to listen a port in src/index. Remember the loadServer
returns that server instance from src/loaders/index to src/index.

We use fastify rather then express beacuse it is faster and is able to handle much more requests.

You see all the application algorithm is done, we just start to listen port on the server and we are good to go, now the only thing left to
check is the api route bindings to fastify instance, lets take a look at that.

## 7. API Route Binder

### Path: src/api/index.ts
