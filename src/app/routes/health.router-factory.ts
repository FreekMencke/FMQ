import { Application, Router } from 'express';
import { Db } from 'mongodb';
import { Tasks } from '../tasks/tasks';
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
        const tasksRunning =
          Tasks.runningTasks.length === Tasks.TASK_COUNT && Tasks.runningTasks.reduce((a, b) => a && b.running!, true);

        if (!tasksRunning) throw new Error('Not all tasks are up and running');

        // fetch an item from the queue to make sure db connection is up.
        await db.stats();
        res.status(200).send('HEALTHY');
      } catch (e) {
        res.status(500).send('UNHEALTHY');
      }
    });
  }
}
