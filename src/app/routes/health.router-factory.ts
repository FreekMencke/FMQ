import { Application, Router } from 'express';
import { Db } from 'mongodb';
import { RouterFactory } from './router.interface';

export class HealthRouterFactory implements RouterFactory {

  create(app: Application, db: Db): void {
    const router = Router();

    this.healthcheck(router, db);

    app.use('/health', router);
  }

  private healthcheck(router: Router, db: Db): void {
    router.get('/', async (req, res) => {
      try {
        // fetch an item from the queue to make sure db connection is up.
        await db.stats();
        res.status(200).send();
      } catch (e) {
        res.status(500).send();
      }
    });
  }

}
