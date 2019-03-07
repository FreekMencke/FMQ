import { Application, Router } from 'express';
import { Db } from 'mongodb';
import { MessageQueue } from '../queue/message-queue';
import { RouterFactory } from './router.interface';

export class QueueRouterFactory implements RouterFactory {
  create(app: Application, db: Db): void {
    const router = Router();

    this.acknowledge(router, db);
    this.pop(router, db);
    this.popAmount(router, db);
    this.ping(router, db);
    this.push(router, db);
    this.size(router, db);

    app.use('/queue', router);
  }

  private acknowledge(router: Router, db: Db): void {
    router.post('/:queue/ack', async (req, res) => {
      try {
        await MessageQueue.ackMany(db, req.params.queue, req.body);

        res.status(204).send();
      } catch (e) {
        res.status(500).send();
      }
    });
  }

  private ping(router: Router, db: Db): void {
    router.post('/:queue/ping', async (req, res) => {
      try {
        const result = await MessageQueue.pingMany(db, req.params.queue, req.body, req.query.expiresIn);

        if (result) res.status(200).send({ expiryDate: result });
        else res.status(500).send();
      } catch (e) {
        res.status(500).send();
      }
    });
  }

  private push(router: Router, db: Db): void {
    router.post('/:queue/push', async (req, res) => {
      try {
        const result =
          req.body instanceof Array
            ? await MessageQueue.pushMany(db, req.params.queue, req.body, req.query.hashCode, req.query.expiresIn)
            : await MessageQueue.pushOne(db, req.params.queue, req.body, req.query.hashCode, req.query.expiresIn);

        res.status(result > 0 ? 201 : 204).send();
      } catch (e) {
        res.status(500).send();
      }
    });
  }

  private pop(router: Router, db: Db): void {
    router.post('/:queue/pop', async (req, res) => {
      try {
        const result = await MessageQueue.popOne(db, req.params.queue, req.query.expiresIn);

        res.status(result !== null ? 200 : 204).send(result);
      } catch (e) {
        res.status(500).send();
      }
    });
  }

  private popAmount(router: Router, db: Db): void {
    router.post('/:queue/pop/:amount', async (req, res) => {
      try {
        const result = await MessageQueue.popMany(db, req.params.queue, Number(req.params.amount), req.query.expiresIn);

        res.status(result!.length > 0 ? 200 : 204).send(result);
      } catch (e) {
        res.status(500).send();
      }
    });
  }

  private size(router: Router, db: Db): void {
    router.get('/:queue/size', async (req, res) => {
      try {
        const size = await MessageQueue.size(db, req.params.queue);

        res.status(200).send({ size });
      } catch (e) {
        res.status(500).send();
      }
    });
  }
}
