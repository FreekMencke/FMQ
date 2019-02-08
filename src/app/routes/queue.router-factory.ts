import { Application, Router } from 'express';
import { Db } from 'mongodb';
import { RouterFactory } from './router.interface';

export class QueueRouterFactory implements RouterFactory {

  create(app: Application, db: Db): void {
    const router = Router();

    this.push(router, db);
    this.pop(router, db);
    this.length(router, db);

    app.use('/queue', router);
  }

  private push(router: Router, db: Db): void {
    router.get('/push', (req, res) => {
      db.collection('queue')
        .insertOne({ payload: req.body })
        .then(({ insertedCount }) => res.status(insertedCount > 0 ? 201 : 500).send())
        .catch(() => res.status(500).send());
    });
  }

  private pop(router: Router, db: Db): void {
    const timeout = new Date();
    timeout.setSeconds(timeout.getSeconds() + 300); // #TODO: move to config.

    router.get('/pop', (req, res) => {
      db.collection('queue')
        .findOneAndUpdate(
          {
            $or: [{ timeout: null }, { timeout: { $lte: new Date() } }]
          },
          {
            $set: { timeout },
            $inc: { tries: 1 }
          }
        )
        .then(({ value }) => res.status(200).json(value))
        .catch(() => res.status(500).send());
    });
  }

  private length(router: Router, db: Db): void {
    router.get('/length', (req, res) => {
      db.collection('queue').countDocuments()
        .then(length => res.status(200).json(length))
        .catch(() => res.status(500).send());
    });
  }

}
