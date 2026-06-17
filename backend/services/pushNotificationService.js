import DeviceToken from '../models/DeviceToken.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const chunk = (items, size = 100) => {
    const batches = [];
    for (let i = 0; i < items.length; i += size) {
        batches.push(items.slice(i, i + size));
    }
    return batches;
};

const sendExpoPushBatch = async (messages) => {
    const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
    });

    const payload = await response.json();
    return payload;
};

export const sendPushNotificationToUser = async ({
    userId,
    title,
    body,
    data = {},
    channelId = 'default',
    categoryId = 'MEDICATION_REMINDER',
}) => {
    const normalizedUserId = String(userId);
    
    const User = (await import('../model/userModel.js')).default;
    const targetUser = await User.findById(normalizedUserId).lean();
    
    // 2. Collect all relevant user IDs (Patient + their Caretaker)
    const notifyUserIds = [normalizedUserId];
    if (targetUser?.caretakerId) {
        notifyUserIds.push(String(targetUser.caretakerId));
    }

    // 3. Find all devices for these users
    const devices = await DeviceToken.find({ userId: { $in: notifyUserIds } }).lean();
    
    if (!devices.length) {
        const allRegisteredUsers = await DeviceToken.distinct('userId');
        console.log(`[Push Debug] No devices for target ${normalizedUserId} or caretakers. Registered:`, allRegisteredUsers);
        return { success: true, message: 'No registered devices', tickets: [] };
    }

    const messages = devices.map((device) => {
        const isCaretaker = String(device.userId) !== normalizedUserId;
        const patientName = targetUser?.name || 'your patient';

        return {
            to: device.pushToken,
            priority: 'high',
            ttl: 120,
            sound: 'default',
            title: isCaretaker ? `Patient Reminder: ${patientName}` : title,
            body: isCaretaker ? `Reminder for ${patientName}: ${body}` : body,
            data,
            channelId,
            categoryId,
        };
    });

    const results = [];
    const batches = chunk(messages);
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const response = await sendExpoPushBatch(batch);
        results.push({ response, batchIndex, batchSize: batch.length });
    }

    const invalidTokens = [];
    const ticketErrors = [];
    let deliveredCount = 0;
    for (const result of results) {
        const tickets = result?.response?.data || [];
        const baseOffset = (result.batchIndex || 0) * 100;
        tickets.forEach((ticket, index) => {
            const device = devices[baseOffset + index];
            if (ticket?.status === 'ok') {
                deliveredCount += 1;
                return;
            }

            if (ticket?.status === 'error') {
                const details = ticket?.details || {};
                ticketErrors.push({
                    pushToken: device?.pushToken || '',
                    error: details?.error || 'UnknownError',
                    message: ticket?.message || 'Push ticket returned an error',
                });
                if (details?.error === 'DeviceNotRegistered' || details?.error === 'InvalidCredentials') {
                    invalidTokens.push(device?.pushToken);
                }
            }
        });
    }

    if (invalidTokens.length) {
        await DeviceToken.deleteMany({ pushToken: { $in: invalidTokens } });
    }

    const failedCount = ticketErrors.length;
    const success = deliveredCount > 0 && failedCount === 0;

    return {
        success,
        message: success ? 'Push notification delivered' : 'Push notification had delivery issues',
        deliveredCount,
        failedCount,
        ticketErrors,
        results: results.map((r) => r.response),
    };
};
