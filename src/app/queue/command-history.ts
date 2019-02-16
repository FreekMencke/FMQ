import { Collection, Db } from 'mongodb';

export class CommandHistory {

  private static readonly COMMAND_HISTORY_COLLECTION = 'command-history';

  static commandHistory(db: Db): Collection {
    return db.collection(CommandHistory.COMMAND_HISTORY_COLLECTION);
  }

  static async shouldExecute(db: Db, hashCode?: string): Promise<boolean> {
    if (!!hashCode) {
      const commandUpdate = await CommandHistory.commandHistory(db)
        .findOneAndUpdate({ hashCode }, { $set: { hashCode }, $inc: { attempts: 1 } }, { upsert: true });

      return !commandUpdate.value;
    }
    return true;
  }

  static async clearCommand(db: Db, hashCode?: string): Promise<void> {
    if (!!hashCode) {
      await CommandHistory.commandHistory(db).deleteOne({ hashCode });
    }
  }

}
