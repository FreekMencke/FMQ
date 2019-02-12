import { Application, Router } from 'express';
import { Db, InsertWriteOpResult, InsertOneWriteOpResult, ObjectId } from 'mongodb';
import { RouterFactory } from './router.interface';

export class QueueRouterFactory implements RouterFactory {

  private readonly DEFAULT_MESSAGE_EXPIRY: number = 300;

  create(app: Application, db: Db): void {
    const router = Router();

    this.acknowledge(router, db);
    this.pop(router, db);
    this.popAmount(router, db);
    this.push(router, db);
    this.size(router, db);

    app.use('/queue', router);
  }

  private acknowledge(router: Router, db: Db): void {
    router.post('/:queue/ack', async (req, res) => {
      if (!(req.body instanceof Array)) return res.status(400).send();

      await db.collection(req.params.queue)
        .deleteMany({
          _id: { $in: req.body.map(id => ObjectId.createFromHexString(id)) },
          tries: { $exists: true }
        })
        .then(() => res.status(204).send())
        .catch(() => res.status(500).send());
    });
  }

  private push(router: Router, db: Db): void {
    router.post('/:queue/push', async (req, res) => {
      let insertPromise: Promise<InsertWriteOpResult | InsertOneWriteOpResult>;
      if (req.body instanceof Array) {
        insertPromise = db.collection(req.params.queue)
          .insertMany(req.body.map(item => ({ payload: item })));
      } else {
        insertPromise = db.collection(req.params.queue)
          .insertOne({ payload: req.body });
      }
      await insertPromise
        .then(({ insertedCount }) => res.status(insertedCount > 0 ? 201 : 500).send())
        .catch(() => res.status(500).send());
    });
  }

  private pop(router: Router, db: Db): void {
    router.post('/:queue/pop', async (req, res) => {
      await db.collection(req.params.queue)
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
    router.post('/:queue/pop/:amount', async (req, res) => {
      try {
        const items = await db.collection(req.params.queue)
          .find({
            $or: [
              { expiryDate: null },
              { expiryDate: { $lte: new Date() } }
            ]
          })
          .limit(Number(req.params.amount || 1)).toArray();

        await db.collection(req.params.queue)
          .updateMany(
            {
              _id: { $in: items.map(item => item._id) },
              $or: [{ expiryDate: null }, { expiryDate: { $lte: new Date() } }]
            },
            {
              $set: { expiryDate: this.getExpiryDate(req.query.expiresIn) },
              $inc: { tries: 1 }
            });

        const results = await db.collection(req.params.queue)
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

  private size(router: Router, db: Db): void {
    router.get('/:queue/size', async (req, res) => {
      await db.collection(req.params.queue).countDocuments()
        .then(size => res.status(200).json(size))
        .catch(() => res.status(500).send());
    });
  }

  private getExpiryDate(expiresIn?: number): Date {
    expiresIn = expiresIn || this.DEFAULT_MESSAGE_EXPIRY;
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
    return expiryDate;
  }

}
