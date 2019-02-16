import { Db } from 'mongodb';
import { MoveToDead } from './move-to-dead.task';

export class Tasks {

  static init(db: Db): void {
    [MoveToDead(db)].forEach(task => task.start());
  }

}
