import { CronJob } from 'cron';
import { Db } from 'mongodb';
import { LogUtils } from '../common/log-utils';
import { CommandHistory } from '../queue/command-history';

export const ClearCommandHistory = (db: Db) => new CronJob('*/15 * * * * *', () => moveToDeadFactory(db));

async function moveToDeadFactory(db: Db): Promise<void> {
  try {
    const collection = await db.collection(CommandHistory.COMMAND_HISTORY_COLLECTION);

    await collection.deleteMany({
      expiryDate: { $lte: new Date() },
    });
  } catch (e) {
    LogUtils.logTask('CLEAR_COMMAND_HISTORY', 'FAILED TO PERFORM CLEAR_COMMAND_HISTORY\n', e);
  }
}
