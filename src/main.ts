import cluster from 'cluster';
import express from 'express';
import { clusterMetrics } from 'express-prom-bundle';
import { MongoClient } from 'mongodb';
import os from 'os';
import { collectDefaultMetrics } from 'prom-client';
import { App } from './app/app';
import { Logger } from './app/common/logger';
import { CommandHistory } from './app/queue/command-history';
import { Tasks } from './app/tasks/tasks';
import { config } from './config/config';

const mongoClient = new MongoClient(config.mongo.url, {
  auth: {
    user: config.mongo.user,
    password: config.mongo.password,
  },
  authSource: config.mongo.authSource,
  authMechanism: 'SCRAM-SHA-1',
  autoReconnect: true,
  reconnectInterval: 5000,
  useNewUrlParser: true,
});

if (cluster.isMaster) {
  Logger.log('TOXMQ ACTIVE - FORKING WORKERS');

  os.cpus().forEach(() => cluster.fork());

  const metricsApp = express();
  metricsApp.use('/metrics', clusterMetrics());
  metricsApp.listen(config.portMetrics);

  cluster.on('exit', worker => {
    Logger.log(`WORKER ${worker.id} DIED - CREATING NEW WORKER`);
    cluster.fork();
  });
} else {
  collectDefaultMetrics();

  mongoClient
    .connect()
    .then(client => {
      const db = client.db('tox-mq');
      App.run(db, cluster.worker);
      Tasks.start(db);
      CommandHistory.collection(db).createIndex('hashCode', { unique: true });
    })
    .catch(err => {
      Logger.log(`WORKER ${cluster.worker.id} ERROR: ${err.message}`);
      cluster.worker.kill();
    });
}
