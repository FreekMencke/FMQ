import cluster from 'cluster';
import { MongoClient } from 'mongodb';
import os from 'os';
import { App } from './app/app';
import { Logger } from './app/common/logger';
import { Tasks } from './app/tasks/tasks';
import { mongoConfig } from './config/mongo-config';

const mongoClient = new MongoClient(mongoConfig.url, {
  auth: {
    user: mongoConfig.user,
    password: mongoConfig.password,
  },
  authMechanism: 'SCRAM-SHA-1',
  autoReconnect: true,
  reconnectInterval: 5000,
  useNewUrlParser: true,
});

if (cluster.isMaster) {
  Logger.log('TOXMQ ACTIVE - FORKING WORKERS');

  os.cpus().forEach(() => cluster.fork());

  cluster.on('exit', worker => {
    Logger.log(`WORKER ${worker.id} DIED - CREATING NEW WORKER`);
    cluster.fork();
  });
} else {
  mongoClient
    .connect()
    .then(client => {
      new App(client.db('tox-mq')).start(cluster.worker);
      Tasks.start(client.db('tox-mq'));
    })
    .catch(() => cluster.worker.kill());
}
