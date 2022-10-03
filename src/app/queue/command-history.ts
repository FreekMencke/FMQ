import { Collection, Db } from 'mongodb';
import { DateUtils } from '../common/date-utils';

export class CommandHistory {
  public static readonly COMMAND_HISTORY_COLLECTION = 'command-history';

  static collection(db: Db): Collection {
    return db.collection(CommandHistory.COMMAND_HISTORY_COLLECTION);
  }

  static async shouldExecute(db: Db, hashCode?: string, expiresIn?: number): Promise<boolean> {
    if (!!hashCode) {
      const commandUpdate = await CommandHistory.collection(db).findOneAndUpdate(
        { hashCode },
        { $set: { hashCode, expiryDate: DateUtils.getExpiryDate(expiresIn) }, $inc: { attempts: 1 } },
        { upsert: true },
      );

      return !commandUpdate.value;
    }
    return true;
  }

  static async clearCommand(db: Db, hashCode?: string): Promise<void> {
    if (!!hashCode) {
      await CommandHistory.collection(db).deleteOne({ hashCode });
    }
  }
}
