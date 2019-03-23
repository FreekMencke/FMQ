import { CronJob } from 'cron';
import { Db } from 'mongodb';
import { ClearCommandHistory } from './clear-command-history.task';
import { MoveToDead } from './move-to-dead.task';

export class Tasks {
  static readonly TASK_COUNT = 2;
  static runningTasks: CronJob[] = [];

  static start(db: Db, stopOld: boolean = true): void {
    if (stopOld) {
      this.runningTasks.forEach(task => task.stop());
      this.runningTasks = [];
    }

    this.initJobs(db);
  }

  private static initJobs(db: Db): void {
    const tasks = this.createTasks(db);
    tasks.forEach(task => task.start());
    this.runningTasks = tasks;
  }

  private static createTasks(db: Db): CronJob[] {
    return [MoveToDead(db), ClearCommandHistory(db)];
  }
}
