import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const extractExpoHost = () => {
    const candidates = [
        Constants?.expoConfig?.hostUri,
        Constants?.manifest2?.extra?.expoGo?.debuggerHost,
        Constants?.expoGoConfig?.debuggerHost,
    ];

    for (const candidate of candidates) {
        if (typeof candidate !== 'string' || !candidate.trim()) continue;
        const host = candidate.split(':')[0]?.trim();
        if (host) return host;
    }
    return '';
};

export const resolveApiBaseUrl = () => {
    // 1) Priority: explicit environment variable.
    // This is the most reliable for physical device LAN testing.
    const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (envUrl) return envUrl.replace(/\/$/, '');

    // 2) Expo development host auto-detection fallback.
    const expoHost = extractExpoHost();
    if (expoHost && expoHost !== 'localhost' && expoHost !== '127.0.0.1') {
        return `http://${expoHost}:4000/api`;
    }

    // 3) Last fallback for local-only simulator testing.
    return 'http://127.0.0.1:4000/api';
};

const API = axios.create({
    baseURL: resolveApiBaseUrl(),
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
    timeout: 10000,
});

const getSavedAuthToken = async () => {
    try {
        return (await AsyncStorage.getItem('med_app_auth_token')) || '';
    } catch {
        return '';
    }
};

API.interceptors.request.use(async (config) => {
    const token = await getSavedAuthToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const setMobileApiAuthToken = (token) => {
    if (token) {
        API.defaults.headers.common.Authorization = `Bearer ${token}`;
        return;
    }

    delete API.defaults.headers.common.Authorization;
};

const responseData = (response) => response?.data || response || {};

export const saveMobileAuthSession = async ({ token, user }) => {
    if (token) {
        await AsyncStorage.setItem('med_app_auth_token', token);
    } else {
        await AsyncStorage.removeItem('med_app_auth_token');
    }

    if (user) {
        await AsyncStorage.setItem('med_app_auth_user', JSON.stringify(user));
    } else {
        await AsyncStorage.removeItem('med_app_auth_user');
    }
};

export const authAPI = {
    isAuthenticated: () => API.get('/auth/is-auth'),
    exchangeSession: (token) => API.post('/auth/exchange-session', token ? { token } : {}),
};

export const userAPI = {
    getMyPatients: () => API.get('/user/my-patients'),
};

export const scheduleAPI = {
    getPatientMeds: (patientId) => API.get(`/schedule/patient/${patientId}`),
    getCaretakerMeds: () => API.get('/schedule/caretaker/medications'),
    confirmTaken: (medId) => API.patch(`/schedule/${medId}/taken`),
};

export const appointmentAPI = {
    getAppointments: (patientId) => API.get('/appointments', patientId ? { params: { patientId } } : undefined),
};

export const trackingAPI = {
    recordIntake: (payload) => API.post('/tracking/record', payload),
};

export const pushAPI = {
    registerToken: (data) => API.post('/push/tokens', data),
    unregisterToken: (data) => API.delete('/push/tokens', { data }),
    claimDeviceLink: (data) => API.post('/push/device-link/claim', data),
    sendTestNotification: (data) => API.post('/push/test-notification', data || {}),
};

export const unwrapApiData = responseData;
