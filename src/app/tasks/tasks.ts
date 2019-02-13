import { Db } from 'mongodb';
import { CleanTaskFactory } from './clean.task';

export class Tasks {

  static init(db: Db): void {
    [CleanTaskFactory(db)].forEach(task => task.start());
  }

}
