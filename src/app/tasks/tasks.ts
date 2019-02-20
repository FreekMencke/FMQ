import { Db } from 'mongodb';
import { ClearCommandHistory } from './clear-command-history.task';
import { MoveToDead } from './move-to-dead.task';

export class Tasks {
  static init(db: Db): void {
    [MoveToDead(db), ClearCommandHistory(db)].forEach(task => task.start());
  }
}
