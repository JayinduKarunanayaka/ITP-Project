import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'med_app_auth_token';
const AUTH_USER_KEY = 'med_app_auth_user';

const safeJsonParse = (value) => {
    try {
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
};

const normalizeToken = (token) => (typeof token === 'string' ? token : '');
const normalizeUser = (user) => {
    if (!user || typeof user !== 'object') return null;
    if (user._id || user.id || user.userId) return user;
    return null;
};

export const saveAuthSession = async (session = {}) => {
    try {
        const token = normalizeToken(session?.token || session?.authToken);
        const user = normalizeUser(session?.user || session?.currentUser);

        if (token) {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        } else {
            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        }

        if (user) {
            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        } else {
            await AsyncStorage.removeItem(AUTH_USER_KEY);
        }
    } catch {
        // Ignore storage failures so the app can still continue in-memory.
    }
};

export const loadAuthSession = async () => {
    try {
        const [token, userJson] = await Promise.all([
            AsyncStorage.getItem(AUTH_TOKEN_KEY),
            AsyncStorage.getItem(AUTH_USER_KEY),
        ]);

        const user = normalizeUser(safeJsonParse(userJson));

        return {
            token: normalizeToken(token),
            user,
        };
    } catch {
        return { token: '', user: null };
    }
};

export const clearAuthSession = async () => {
    try {
        await Promise.all([
            AsyncStorage.removeItem(AUTH_TOKEN_KEY),
            AsyncStorage.removeItem(AUTH_USER_KEY),
        ]);
    } catch {
        // Ignore storage failures so logout/auth reset still works.
    }
};
