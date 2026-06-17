import Medication from '../model/Medication.js';
import { sendPushNotificationToUser } from '../services/pushNotificationService.js';
import {
    advanceReminderRetry,
    ensureNextDailyTrackingSchedule,
    finalizeMissedReminder,
    getActiveReminderLogs,
    getExpiredReminderLogs,
} from '../services/reminderLifecycleService.js';

const initScheduledReminderCron = () => {
    setInterval(async () => {
        try {
            const now = new Date();
            const dueLogs = await getActiveReminderLogs({ before: now });

            for (const log of dueLogs) {
                const medication = await Medication.findById(log.medicationId).lean();
                if (!medication || medication.status !== 'active') {
                    continue;
                }

                const nextAttempt = Math.min((log.reminderAttempts || 0) + 1, log.maxReminderAttempts || 1);
                const isFinalAttempt = nextAttempt >= (log.maxReminderAttempts || 1);
                const retryLabel = nextAttempt > 1 ? ` (attempt ${nextAttempt}/${log.maxReminderAttempts})` : '';

                try {
                    const pushResult = await sendPushNotificationToUser({
                        userId: log.userId,
                        title: isFinalAttempt ? 'Final medication reminder' : 'Medication reminder',
                        body: `It is time to take ${log.medicationName}${retryLabel}`,
                        data: {
                            screen: 'alerts',
                            type: isFinalAttempt ? 'FINAL_REMINDER' : 'SCHEDULED_REMINDER',
                            medicationId: String(log.medicationId),
                            medicationName: log.medicationName,
                            trackingLogId: String(log._id),
                            scheduledTime: log.scheduledTime?.toISOString?.() || null,
                            retryAttempt: nextAttempt,
                            maxReminderAttempts: log.maxReminderAttempts,
                            confirmUntil: log.confirmUntil?.toISOString?.() || null,
                            customMessage: log.customMessage || null,
                            customAudio: log.customAudio || null,
                        },
                    });

                    console.log(`[Scheduled Reminder] Attempted push for user ${log.userId}. Result: ${pushResult.message}, Devices notified: ${pushResult.deliveredCount || 0}`);

                    advanceReminderRetry(log, now);
                    await log.save();
                } catch (sendError) {
                    console.error('[Scheduled Reminder Cron] Reminder send failed; retry state not advanced:', {
                        trackingLogId: String(log._id),
                        medicationId: String(log.medicationId),
                        userId: String(log.userId),
                        error: sendError?.message || sendError,
                    });
                }
            }

            const expiredLogs = await getExpiredReminderLogs({ before: now });
            for (const log of expiredLogs) {
                const wasAlreadyMissed = log.status === 'Missed' && log.missedNotifiedAt;
                if (wasAlreadyMissed) {
                    continue;
                }

                // Preserve interval metadata before finalization
                const { scheduledTime, confirmUntil, ...retryFields } = log;
                finalizeMissedReminder(log, now);
                Object.assign(log, retryFields); // Restore retry fields
                await log.save();

                await sendPushNotificationToUser({
                    userId: log.userId,
                    title: 'Missed dose detected',
                    body: `${log.medicationName} was automatically marked as missed.`,
                    data: {
                        screen: 'alerts',
                        type: 'MISSED_DOSE',
                        medicationId: String(log.medicationId),
                        medicationName: log.medicationName,
                        trackingLogId: String(log._id),
                        scheduledTime: scheduledTime?.toISOString?.() || null,
                        confirmUntil: confirmUntil?.toISOString?.() || null,
                        customMessage: log.customMessage || null,
                        customAudio: log.customAudio || null,
                    },
                });

                // Schedule next day's reminder for recurring schedules (within date range).
                try {
                    const medication = await Medication.findById(log.medicationId).lean();
                    if (medication?.time && medication?.status === 'active') {
                        await ensureNextDailyTrackingSchedule({
                            userId: log.userId,
                            medicationId: log.medicationId,
                            medicationName: medication.medicationName || medication.name || log.medicationName,
                            time: medication.time,
                            startDate: medication.scheduleStartDate,
                            endDate: medication.scheduleEndDate,
                            after: scheduledTime || log.scheduledTime,
                        });
                    }
                } catch {
                    // Ignore next-schedule creation failures.
                }
            }
        } catch (error) {
            console.error('[Scheduled Reminder Cron] Error:', error);
        }
    }, 60 * 1000);
};

export default initScheduledReminderCron;
