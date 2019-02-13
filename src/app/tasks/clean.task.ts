import { Db } from 'mongodb';
import { CronJob } from 'cron';
import { Logger } from '../common/logger';

export const CleanTaskFactory = (db: Db) =>
  new CronJob('*/30 * * * * *', () => cleanFactory(db));

async function cleanFactory(db: Db): Promise<void> {
  try {
    (await db.collections())
      .filter(col => !col.collectionName.endsWith('-dead'))
      .forEach(async col => {
        const deadMessages = await col
          .find({
            $or: [{ expiryDate: null }, { expiryDate: { $lte: new Date() } }],
            tries: { $gte: 5 }
          })
          .toArray();

        if (deadMessages.length === 0) return;

        await db.collection(col.collectionName + '-dead').insertMany(deadMessages);
        await col.deleteMany({ _id: { $in: deadMessages.map(msg => msg._id) } });
      });
  } catch (e) {
    Logger.logTask('CLEAN_TASK', 'FAILED TO PERFORM CLEAN_TASK\n', e);
  }
}
