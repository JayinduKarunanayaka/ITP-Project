import DeviceToken from '../models/DeviceToken.js';
import { sendPushNotificationToUser } from '../services/pushNotificationService.js';

export const registerPushToken = async (req, res) => {
    try {
        const { userId, pushToken, deviceType, platform } = req.body;

        if (!userId || !pushToken) {
            return res.status(400).json({
                success: false,
                message: 'Missing userId or pushToken',
            });
        }

        const device = await DeviceToken.findOneAndUpdate(
            { userId, pushToken },
            {
                $set: {
                    userId,
                    pushToken,
                    deviceType: deviceType || 'unknown',
                    platform: platform || '',
                    lastActive: new Date(),
                },
            },
            { new: true, upsert: true }
        );

        console.log('[Push] token registered', { userId: String(userId), platform: platform || '', deviceType: deviceType || 'unknown' });

        return res.status(201).json({
            success: true,
            message: 'Push token registered successfully',
            device,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const unregisterPushToken = async (req, res) => {
    try {
        const { userId, pushToken } = req.body;

        if (!userId || !pushToken) {
            return res.status(400).json({
                success: false,
                message: 'Missing userId or pushToken',
            });
        }

        await DeviceToken.deleteOne({ userId, pushToken });

        return res.json({
            success: true,
            message: 'Push token removed successfully',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const sendTestPushNotification = async (req, res) => {
    try {
        const userId = req.userId || req.body?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }

        const title = (req.body?.title || 'Medication test notification').toString().trim();
        const body = (req.body?.body || 'Test reminder from API').toString().trim();

        const result = await sendPushNotificationToUser({
            userId,
            title,
            body,
            data: {
                screen: 'alerts',
                type: 'SCHEDULED_REMINDER',
                medicationId: 'test-medication',
                medicationName: 'Test Medication',
                trackingLogId: 'test-tracking-log',
                scheduledTime: new Date().toISOString(),
                retryAttempt: 1,
                maxReminderAttempts: 4,
                confirmUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                isTest: true,
            },
        });

        if (!result?.success) {
            return res.status(502).json({
                success: false,
                message: result?.message || 'Push notification delivery failed',
                result,
            });
        }

        return res.json({
            success: true,
            message: 'Test push notification dispatched',
            result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
