import cluster from 'cluster';
import { MongoClient, MongoClientOptions } from 'mongodb';
import os from 'os';
import { App } from './app/app';
import { Logger } from './app/common/logger';
import { mongoConfig } from './config/mongo-config';

if (cluster.isMaster) {
  Logger.log('TOXMQ ACTIVE - FORKING WORKERS');

  os.cpus().forEach(() => cluster.fork());

  cluster.on('exit', worker => {
    Logger.log(`WORKER ${worker.id} DIED - CREATING NEW WORKER`);
    cluster.fork();
  });
} else {
  new MongoClient(mongoConfig.url, <MongoClientOptions>{
    auth: {
      user: mongoConfig.user,
      password: mongoConfig.password
    },
    authMechanism: 'SCRAM-SHA-1',
    autoReconnect: true,
    reconnectInterval: 5000,
    useNewUrlParser: true
  }).connect().then(client => {
    new App(client.db('tox-mq')).start(cluster.worker);
  }).catch(() => cluster.worker.kill());
}
