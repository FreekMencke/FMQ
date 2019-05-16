import cluster from 'cluster';
import { MongoClient } from 'mongodb';
import os from 'os';
import { App } from './app/app';
import { Logger } from './app/common/logger';
import { Tasks } from './app/tasks/tasks';
import { config } from './config/config';

const mongoClient = new MongoClient(config.mongo.url, {
  auth: {
    user: config.mongo.user,
    password: config.mongo.password,
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
      App.run(client.db('tox-mq'), cluster.worker);
      Tasks.start(client.db('tox-mq'));
    })
    .catch(err => {
      Logger.log(`WORKER ${cluster.worker.id} ERROR: ${err.message}`);
      cluster.worker.kill();
    });
}
