import { CronJob } from 'cron';
import { Db } from 'mongodb';
import { Logger } from '../common/logger';
import { CommandHistory } from '../queue/command-history';

export const ClearCommandHistory = (db: Db) => new CronJob('*/30 * * * * *', () => moveToDeadFactory(db));

async function moveToDeadFactory(db: Db): Promise<void> {
  try {
    const collection = await db.collection(CommandHistory.COMMAND_HISTORY_COLLECTION);

    await collection.deleteMany({
      expiryDate: { $lte: new Date() },
    });
  } catch (e) {
    Logger.logTaskError('CLEAR_COMMAND_HISTORY', 'FAILED TO PERFORM CLEAR_COMMAND_HISTORY\n', e);
  }
}
