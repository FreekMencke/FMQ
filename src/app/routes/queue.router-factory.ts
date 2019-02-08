import { Application, Router } from 'express';
import { Db } from 'mongodb';
import { RouterFactory } from './router.interface';

export class QueueRouterFactory implements RouterFactory {

  create(app: Application, db: Db): void {
    const router = Router();

    // this.healthcheck(router, db);

    app.use('/queue', router);
  }

  // private healthcheck(router: express.Router, db: Db): void {
  //   router.get('/', async (req, res) => {
  //     try {
  //       // fetch an item from the queue to make sure db connection is up.
  //       await db.collection('queue').findOne({});
  //       res.status(200).send();
  //     } catch(e) {
  //       res.status(500).send();
  //     }
  //   });
  // }

}
