import { CronJob } from 'cron';
import { Db } from 'mongodb';
import { CryptoUtils } from '../common/crypto-utils';
import { LogUtils } from '../common/log-utils';
import { MongoUtils } from '../common/mongo-utils';

export const MoveToDead = (db: Db) => new CronJob('0 * * * * *', () => moveToDeadFactory(db));

async function moveToDeadFactory(db: Db): Promise<void> {
  try {
    (await db.collections())
      .filter(col => col.collectionName.startsWith(MongoUtils.QUEUE_PREFIX) && !col.collectionName.endsWith('-dead'))
      .forEach(async col => {
        const dead_uid = CryptoUtils.generateId();

        await col.updateMany(
          {
            expiryDate: { $not: { $gt: new Date() } },
            attempts: { $gte: 5 },
            dead: { $exists: false },
          },
          {
            $set: {
              dead_uid,
              dead: true,
            },
          },
        );

        const deadMessages = await col.find({ dead_uid }).toArray();

        if (deadMessages.length === 0) return;

        const bulkOp = db.collection(col.collectionName + '-dead').initializeUnorderedBulkOp();

        deadMessages.forEach(({ payload }) =>
          bulkOp
            .find({ payload })
            .upsert()
            .update({ $set: { payload }, $inc: { attempts: 1 } }),
        );

        await bulkOp.execute();
        await col.deleteMany({ _id: { $in: deadMessages.map(msg => msg._id) } });
      });
  } catch (e) {
    LogUtils.logTask('CLEAR_COMMAND_HISTORY', 'FAILED TO PERFORM CLEAR_COMMAND_HISTORY\n', e);
    LogUtils.logTask('MOVE_TO_DEAD', 'FAILED TO PERFORM MOVE_TO_DEAD\n', e);
  }
}
