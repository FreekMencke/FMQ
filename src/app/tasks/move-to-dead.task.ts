import { Db } from 'mongodb';
import { CronJob } from 'cron';
import { Logger } from '../common/logger';
import { Queue } from '../queue/queue';

export const MoveToDead = (db: Db) =>
  new CronJob('*/30 * * * * *', () => moveToDeadFactory(db));

async function moveToDeadFactory(db: Db): Promise<void> {
  try {
    (await db.collections())
      .filter(col => col.collectionName.startsWith(Queue.QUEUE_PREFIX) && !col.collectionName.endsWith('-dead'))
      .forEach(async col => {
        const deadMessages = await col
          .find({
            $or: [{ expiryDate: null }, { expiryDate: { $lte: new Date() } }],
            attempts: { $gte: 5 }
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
