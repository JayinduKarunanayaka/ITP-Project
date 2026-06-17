import cron from 'node-cron';

const initMissedDoseCron = () => {
    // Legacy sweep disabled in favor of reminderLifecycleService-based confirm windows.
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('[Cron Task] Legacy missed-dose sweep is disabled; confirm-window miss handling is active.');
        } catch (error) {
            console.error('[Cron Task] Legacy missed-dose sweep error:', error);
        }
    });
};

export default initMissedDoseCron;
