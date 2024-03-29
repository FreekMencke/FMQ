import { Worker } from 'cluster';
import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import prometheusMetricsMiddleware from 'express-prom-bundle';
import helmet from 'helmet';
import { Db } from 'mongodb';
import { AggregatorRegistry } from 'prom-client';
import { config } from '../config/config';
import { LogUtils } from './common/log-utils';
import { requestLogger } from './middleware/logger.middleware';
import { HealthRouterFactory } from './routes/health.router-factory';
import { QueueRouterFactory } from './routes/queue.router-factory';
import { RouterFactory } from './routes/router.interface';

export class App {
  private _app: Application;
  private _db: Db;

  static run(db: Db, worker: Worker): void {
    new App(db).start(worker);
  }

  private constructor(db: Db) {
    this._app = express();
    this._db = db;

    this.setupMiddleware();
    this.setupRouters();
  }

  private start(worker: Worker): void {
    this._app.listen(config.port, () => {
      LogUtils.log(`WORKER ${worker.id} CREATED ON PORT ${config.port}`);
    });
  }

  private setupMiddleware(): void {
    this._app.use(cors({ origin: config.allowedOrigins }));
    this._app.use(compression());
    this._app.use(helmet());
    this._app.use(express.json());
    this._app.use(requestLogger(['/health', '/metrics']));
    this._app.use(
      prometheusMetricsMiddleware({
        autoregister: false,
        includeMethod: true,
        includePath: true,
        promClient: {
          collectDefaultMetrics: {
            register: new AggregatorRegistry(),
          },
        },
      }),
    );
  }

  private setupRouters(): void {
    const routerFactories: RouterFactory[] = [new HealthRouterFactory(), new QueueRouterFactory()];
    routerFactories.forEach(routerFactory => routerFactory.create(this._app, this._db));
  }
}
