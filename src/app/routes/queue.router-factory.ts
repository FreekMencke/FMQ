import { Application, Router } from 'express';
import { Db, InsertWriteOpResult, InsertOneWriteOpResult } from 'mongodb';
import { RouterFactory } from './router.interface';

export class QueueRouterFactory implements RouterFactory {

  private readonly DEFAULT_MESSAGE_EXPIRY: number = 300;

  create(app: Application, db: Db): void {
    const router = Router();

    this.push(router, db);
    this.pop(router, db);
    this.popAmount(router, db);
    this.length(router, db);

    app.use('/queue', router);
  }

  private push(router: Router, db: Db): void {
    router.post('/push', async (req, res) => {
      let insertPromise: Promise<InsertWriteOpResult | InsertOneWriteOpResult>;
      if (req.body instanceof Array) {
        insertPromise = db.collection('queue')
          .insertMany(req.body.map(item => ({ payload: item })));
      } else {
        insertPromise = db.collection('queue')
          .insertOne({ payload: req.body });
      }
      await insertPromise
        .then(({ insertedCount }) => res.status(insertedCount > 0 ? 201 : 500).send())
        .catch(() => res.status(500).send());
    });
  }

  private getExpiryDate(expiresIn?: number): Date {
    expiresIn = expiresIn || this.DEFAULT_MESSAGE_EXPIRY;
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
    return expiryDate;
  }

  private pop(router: Router, db: Db): void {
    router.get('/pop', async (req, res) => {
      await db.collection('queue')
        .findOneAndUpdate(
          {
            $or: [{ expiryDate: null }, { expiryDate: { $lte: new Date() } }]
          },
          {
            $set: { expiryDate: this.getExpiryDate(req.query.expiresIn) },
            $inc: { tries: 1 }
          }
        )
        .then(({ value }) => res.status(value ? 200 : 204).send(value))
        .catch(() => res.status(500).send());
    });
  }

  private popAmount(router: Router, db: Db): void {
    router.get('/pop/:amount', async (req, res) => {
      try {
        const items = await db.collection('queue')
          .find({
            $or: [
              { expiryDate: null },
              { expiryDate: { $lte: new Date() } }
            ]
          })
          .limit(Number(req.params.amount || 1)).toArray();

        await db.collection('queue')
          .updateMany(
            {
              _id: { $in: items.map(item => item._id) },
              $or: [{ expiryDate: null }, { expiryDate: { $lte: new Date() } }]
            },
            {
              $set: { expiryDate: this.getExpiryDate(req.query.expiresIn) },
              $inc: { tries: 1 }
            });

        const results = await db.collection('queue')
          .find({
            _id: { $in: items.map(item => item._id) }
          })
          .limit(Number(req.params.amount || 1)).toArray();

        if (results && results.length > 0) {
          res.status(200).send(results);
        } else {
          res.status(204).send([]);
        }
      } catch (e) {
        res.status(500).send();
      }
    });
  }

  private length(router: Router, db: Db): void {
    router.get('/length', async (req, res) => {
      await db.collection('queue').countDocuments()
        .then(length => res.status(200).json(length))
        .catch(() => res.status(500).send());
    });
  }

}
