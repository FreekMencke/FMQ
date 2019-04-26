import bodyParser from 'body-parser';
import { Worker } from 'cluster';
import compression from 'compression';
import express, { Application } from 'express';
import helmet from 'helmet';
import { Db } from 'mongodb';
import { config } from '../config/config';
import { Logger } from './common/logger';
import { HealthRouterFactory } from './routes/health.router-factory';
import { QueueRouterFactory } from './routes/queue.router-factory';
import { RouterFactory } from './routes/router.interface';

export class App {
  private _app: Application;
  private _db: Db;

  static run(db: Db, worker: Worker): App {
    const app = new App(db);
    app.start(worker);
    return app;
  }

  constructor(db: Db) {
    this._app = express();
    this._db = db;

    this.setupMiddleware();
    this.setupRouters();
  }

  private start(worker: Worker): void {
    this._app.listen(config.port, () => {
      Logger.log(`WORKER ${worker.id} CREATED ON PORT ${config.port}`);
      this.setupRouters();
    });
  }

  private setupMiddleware(): void {
    this._app.use(compression());
    this._app.use(helmet({ noCache: true }));
    this._app.use(bodyParser.urlencoded({ extended: true }));
    this._app.use(bodyParser.json());
  }

  private setupRouters(): void {
    const routerFactories: RouterFactory[] = [new HealthRouterFactory(), new QueueRouterFactory()];
    routerFactories.forEach(routerFactory => routerFactory.create(this._app, this._db));
  }
}
