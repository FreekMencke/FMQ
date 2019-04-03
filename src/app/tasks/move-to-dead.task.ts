import { CronJob } from 'cron';
import { Db } from 'mongodb';
import { v4 as uuidV4 } from 'uuid';
import { Logger } from '../common/logger';
import { MongoUtils } from '../common/utils/mongo-utils';

export const MoveToDead = (db: Db) => new CronJob('*/30 * * * * *', () => moveToDeadFactory(db));

async function moveToDeadFactory(db: Db): Promise<void> {
  try {
    (await db.collections())
      .filter(col => col.collectionName.startsWith(MongoUtils.QUEUE_PREFIX) && !col.collectionName.endsWith('-dead'))
      .forEach(async col => {
        const uuid = uuidV4();

        await col.updateMany(
          {
            $or: [{ expiryDate: null }, { expiryDate: { $lte: new Date() } }],
            attempts: { $gte: 5 },
            dead: { $exists: false },
          },
          {
            $set: {
              uuid,
              dead: true,
            },
          }
        );

        const deadMessages = await col.find({ uuid }).toArray();

        if (deadMessages.length === 0) return;

        const bulkOp = db.collection(col.collectionName + '-dead').initializeUnorderedBulkOp();

        deadMessages.forEach(({ payload }) =>
          bulkOp
            .find({ payload })
            .upsert()
            .update({ $set: { payload }, $inc: { attempts: 1 } })
        );

        await bulkOp.execute();
        await col.deleteMany({ _id: { $in: deadMessages.map(msg => msg._id) } });
      });
  } catch (e) {
    Logger.logTask('CLEAR_COMMAND_HISTORY', 'FAILED TO PERFORM CLEAR_COMMAND_HISTORY\n', e);
    Logger.logTask('MOVE_TO_DEAD', 'FAILED TO PERFORM MOVE_TO_DEAD\n', e);
  }
}
