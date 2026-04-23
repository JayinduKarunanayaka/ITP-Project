import cron from 'node-cron';
import TrackingLog from '../models/TrackingLog.js';

const initMissedDoseCron = () => {
    cron.schedule('*/30 * * * *', async () => {
        try {
            console.log(`[Cron Task] Running missed doses check: ${new Date().toLocaleString()}`);

            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

            const queryCriteria = {
                status: 'Pending',
                scheduledTime: { $lt: twoHoursAgo }
            };

            const outdatedLogs = await TrackingLog.find(queryCriteria);

            if (outdatedLogs.length > 0) {
                const result = await TrackingLog.updateMany(
                    queryCriteria, 
                    { $set: { status: 'Missed' } }
                );
                
                console.log(`[Cron Task] Successfully updated ${result.modifiedCount} pending doses to 'Missed'.`);
            } else {
                console.log(`[Cron Task] No outdated pending doses found.`);
            }

        } catch (error) {
            console.error(`[Cron Task] Error in sweeping doses mapping. details:`, error);
        }
    });
};

export default initMissedDoseCron;
