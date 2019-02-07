import bodyParser from 'body-parser';
import cluster from 'cluster';
import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import { config } from '../config/config';
import { Logger } from './common/logger';
import { HealthRouter } from './routes/health.router';

export class App {

  private _app: Application;

  constructor() {
    this._app = express();

    this.setupMiddleware();
    this.setupRouters();
  }

  start(worker: cluster.Worker): void {
    this._app.listen(config.port, () => {
      Logger.log(`WORKER ${worker.id} CREATED ON PORT ${config.port}`);
      this.setupRouters();
    });
  }

  private setupMiddleware(): void {
    this._app.use(compression());
    this._app.use(helmet());
    this._app.use(cors({
      origin: (origin, callback) => callback(null, config.allowedOrigins.includes(origin))
    }));
    this._app.use(bodyParser.urlencoded({ extended: true }));
    this._app.use(bodyParser.json());
  }

  private setupRouters(): void {
    HealthRouter.create(this._app);
  }

}
