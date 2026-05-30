import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { pushAPI, resolveApiBaseUrl } from './api/api.js';

export const MEDICATION_REMINDER_CATEGORY = 'MEDICATION_REMINDER';
export const MEDICATION_ACTION_TAKEN = 'MEDICATION_ACTION_TAKEN';
export const MEDICATION_ACTION_MISSED = 'MEDICATION_ACTION_MISSED';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const configureAndroidChannel = async () => {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            sound: 'default',
        });
    }

    await Notifications.setNotificationCategoryAsync(MEDICATION_REMINDER_CATEGORY, [
        {
            identifier: MEDICATION_ACTION_TAKEN,
            buttonTitle: 'Taken',
            options: { opensAppToForeground: true },
        },
        {
            identifier: MEDICATION_ACTION_MISSED,
            buttonTitle: 'Missed',
            options: { opensAppToForeground: true, isDestructive: true },
        },
    ]);
};

const getUserId = (user) => user?._id || user?.id || user?.userId || '';

const getExpoPushToken = async () => {
    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        undefined;

    const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
    );
    return tokenData?.data || '';
};

export const claimDeviceLinkAsync = async ({ linkCode, deviceId, platform = Platform.OS, deviceType = 'mobile' }) => {
    if (!linkCode) {
        return { success: false, message: 'Missing link code' };
    }

    let pushToken = '';
    try {
        pushToken = await getExpoPushToken();
    } catch {
        // Push service issues should not block link claim.
        pushToken = '';
    }

    if (typeof pushAPI.claimDeviceLink !== 'function') {
        return { success: false, message: 'Device-link endpoint is unavailable' };
    }

    const claimPayload = {
        linkCode,
        deviceId,
        platform,
        deviceType,
        pushToken,
    };

    const endpoint = `${resolveApiBaseUrl()}/push/device-link/claim`;
    const doClaimRequest = async () => {
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(claimPayload),
            });

            const text = await res.text();
            let data = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                data = {};
            }

            if (!res.ok) {
                throw new Error(data?.message || `HTTP ${res.status}`);
            }

            return { data };
        } catch (error) {
            const lowLevel = `${error?.name || 'Error'}: ${error?.message || 'Unknown failure'}`;
            throw new Error(lowLevel);
        }
    };

    let response;
    try {
        response = await doClaimRequest();
    } catch (error) {
        const message = error?.message || '';
        const isTransientNetwork = /network\s*error|network request failed|timeout|aborted/i.test(message);
        if (!isTransientNetwork) {
            throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, 700));
        try {
            response = await doClaimRequest();
        } catch (retryError) {
            const retryMessage = retryError?.message || 'Network Error';
            throw new Error(`${retryMessage} (claim endpoint: ${endpoint})`);
        }
    }

    return {
        success: true,
        userId: response?.data?.userId || '',
        token: response?.data?.token || '',
        user: response?.data?.user || null,
        pushToken,
        device: response?.data?.device || null,
    };
};

export const registerForPushNotificationsAsync = async (user) => {
    const userId = getUserId(user);

    if (!userId) {
        return { pushToken: '', registered: false, message: 'No signed-in user available' };
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return { pushToken: '', registered: false, message: 'Push permission not granted' };
    }

    const pushToken = await getExpoPushToken();

    if (!pushToken) {
        return { pushToken: '', registered: false, message: 'Unable to get Expo push token' };
    }

    if (typeof pushAPI.registerToken !== 'function') {
        return { pushToken, registered: false, message: 'Push registration endpoint is unavailable' };
    }

    await pushAPI.registerToken({
        userId,
        pushToken,
        deviceType: 'mobile',
        platform: Platform.OS,
    });

    return { pushToken, registered: true, message: 'Push token registered successfully' };
};

export const unregisterPushTokenAsync = async (user, pushToken) => {
    const userId = getUserId(user);
    if (!userId || !pushToken || typeof pushAPI.unregisterToken !== 'function') return;

    await pushAPI.unregisterToken({ userId, pushToken });
};

export const subscribeToNotificationEvents = (onReceive, onResponse) => {
    const receiveSub = Notifications.addNotificationReceivedListener((notification) => {
        onReceive?.(notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        onResponse?.(response);
    });

    return () => {
        receiveSub.remove();
        responseSub.remove();
    };
};

export const setNotificationListener = (onReceive, onResponse) => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
        const { data } = notification.request.content;
        if (data?.type === 'SCHEDULED_REMINDER' || data?.type === 'FINAL_REMINDER' || data?.type === 'MISSED_DOSE' || data?.isTest) {
            // Immediately surface reminder notifications
            onReceive?.(notification);
        }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        onResponse?.(response);
    });

    return () => {
        subscription.remove();
        responseSubscription.remove();
    };
};

// Helper function to handle notification wake-up
export const handleNotificationWake = async () => {
    const { status } = await Notifications.getPermissionsAsync();

    if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
            return false;
        }
    }

    return true;
};
