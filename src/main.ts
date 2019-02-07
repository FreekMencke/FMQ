import os from 'os';
import cluster from 'cluster';

import { Logger } from './app/common/logger';

import { App } from './app/app';

if (cluster.isMaster) {
  Logger.log('TOXMQ ACTIVE - FORKING WORKERS');

  os.cpus().forEach(() => cluster.fork());

  cluster.on('exit', (worker: cluster.Worker) => {
    Logger.log(`WORKER ${worker.id} DIED - CREATING NEW WORKER`);
    cluster.fork();
  });
} else {
  new App().start(cluster.worker);
}
