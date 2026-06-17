import TrackingLog from '../models/TrackingLog.js';

const DEFAULT_CONFIRM_WINDOW_MINUTES = Number(process.env.REMINDER_CONFIRM_WINDOW_MINUTES || 10);
const DEFAULT_REMINDER_INTERVAL_MINUTES = Number(process.env.REMINDER_RETRY_INTERVAL_MINUTES || 3);
const DEFAULT_MAX_REMINDER_ATTEMPTS = Number(process.env.REMINDER_MAX_ATTEMPTS || 4);

const TIME_ONLY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const startOfDay = (value) => {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return null;
    dt.setHours(0, 0, 0, 0);
    return dt;
};

const endOfDay = (value) => {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return null;
    dt.setHours(23, 59, 59, 999);
    return dt;
};

const dateWithTime = (dateOnly, hhmm) => {
    const match = String(hhmm || '').trim().match(TIME_ONLY_PATTERN);
    if (!match) return null;
    const base = startOfDay(dateOnly);
    if (!base) return null;
    base.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return base;
};

const parseDateTime = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

    if (typeof value === 'string') {
        const trimmed = value.trim();
        const hhmmMatch = trimmed.match(TIME_ONLY_PATTERN);
        if (hhmmMatch) {
            const now = new Date();
            const scheduled = new Date(now);
            scheduled.setSeconds(0, 0);
            scheduled.setHours(Number(hhmmMatch[1]), Number(hhmmMatch[2]), 0, 0);

            if (scheduled <= now) {
                scheduled.setDate(scheduled.getDate() + 1);
            }
            return scheduled;
        }
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const minutesFromNow = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);

export const buildReminderWindow = (scheduledTime, overrides = {}) => {
    const now = overrides?.now instanceof Date && !Number.isNaN(overrides.now.getTime()) ? overrides.now : new Date();
    const start = overrides?.startDate ? startOfDay(overrides.startDate) : null;
    const end = overrides?.endDate ? endOfDay(overrides.endDate) : null;

    let base = null;
    const raw = typeof scheduledTime === 'string' ? scheduledTime.trim() : scheduledTime;
    const timeOnly = typeof raw === 'string' && TIME_ONLY_PATTERN.test(raw);
    if (timeOnly && start) {
        base = dateWithTime(start, raw);
        if (base && base <= now) {
            // Move forward day-by-day until it is in the future.
            while (base <= now) base = new Date(base.getTime() + 24 * 60 * 60 * 1000);
        }
    } else {
        base = parseDateTime(scheduledTime);
    }
    if (!base) return null;
    if (start && base < start) base = dateWithTime(start, raw);
    if (end && base > end) return null;

    const confirmWindowMinutes = Number.isFinite(Number(overrides.confirmWindowMinutes))
        ? Number(overrides.confirmWindowMinutes)
        : DEFAULT_CONFIRM_WINDOW_MINUTES;
    const reminderIntervalMinutes = Number.isFinite(Number(overrides.reminderIntervalMinutes))
        ? Number(overrides.reminderIntervalMinutes)
        : DEFAULT_REMINDER_INTERVAL_MINUTES;
    const maxReminderAttempts = Number.isFinite(Number(overrides.maxReminderAttempts))
        ? Number(overrides.maxReminderAttempts)
        : DEFAULT_MAX_REMINDER_ATTEMPTS;

    return {
        scheduledTime: base,
        confirmUntil: minutesFromNow(base, confirmWindowMinutes),
        reminderIntervalMinutes,
        maxReminderAttempts,
        nextReminderAt: base,
        retryState: 'active',
        status: 'Pending',
        reminderAttempts: 0,
        lastReminderSentAt: null,
        missedNotifiedAt: null,
    };
};

export const createTrackingSchedule = async ({ userId, medicationId, medicationName, scheduledTime, customMessage, customAudio, note = '', overrides = {} }) => {
    const window = buildReminderWindow(scheduledTime, overrides);
    if (!window) {
        throw new Error('Invalid scheduledTime');
    }

    const existing = await TrackingLog.findOne({ userId, medicationId, scheduledTime: window.scheduledTime });
    if (existing) {
        existing.medicationName = medicationName || existing.medicationName;
        existing.note = note || existing.note;
        existing.customMessage = customMessage || existing.customMessage;
        existing.customAudio = customAudio || existing.customAudio;
        existing.confirmUntil = window.confirmUntil;
        existing.reminderIntervalMinutes = window.reminderIntervalMinutes;
        existing.maxReminderAttempts = window.maxReminderAttempts;
        existing.nextReminderAt = window.nextReminderAt;
        existing.retryState = window.retryState;
        existing.status = 'Pending';
        existing.reminderAttempts = 0;
        existing.lastReminderSentAt = null;
        existing.missedNotifiedAt = null;
        await existing.save();
        return existing;
    }

    return TrackingLog.create({
        userId,
        medicationId,
        medicationName,
        scheduledTime: window.scheduledTime,
        note,
        customMessage,
        customAudio,
        ...window,
    });
};

const nextOccurrenceAfter = ({ after, time, startDate, endDate }) => {
    if (!after || !time) return null;
    const start = startDate ? startOfDay(startDate) : null;
    const end = endDate ? endOfDay(endDate) : null;
    const afterDate = new Date(after);
    if (Number.isNaN(afterDate.getTime())) return null;

    // Start from next day relative to "after" date.
    const nextDay = startOfDay(afterDate);
    if (!nextDay) return null;
    nextDay.setDate(nextDay.getDate() + 1);

    let candidate = dateWithTime(nextDay, time);
    if (!candidate) return null;
    if (start && candidate < start) candidate = dateWithTime(start, time);
    if (end && candidate > end) return null;
    return candidate;
};

export const ensureNextDailyTrackingSchedule = async ({
    userId,
    medicationId,
    medicationName,
    time,
    startDate,
    endDate,
    after,
    overrides = {},
}) => {
    const next = nextOccurrenceAfter({ after, time, startDate, endDate });
    if (!next) return null;

    const existing = await TrackingLog.findOne({ userId, medicationId, scheduledTime: next });
    if (existing) return existing;

    return createTrackingSchedule({
        userId,
        medicationId,
        medicationName,
        scheduledTime: next,
        overrides: {
            ...overrides,
            startDate,
            endDate,
        },
    });
};

export const getActiveReminderLogs = async ({ before = new Date(), limit = 200 } = {}) => {
    return TrackingLog.find({
        retryState: 'active',
        status: { $in: ['Pending', 'Alerted'] },
        nextReminderAt: { $lte: before },
        confirmUntil: { $gt: before },
        missedNotifiedAt: null,
        $expr: { $lt: ['$reminderAttempts', '$maxReminderAttempts'] },
    })
        .sort({ nextReminderAt: 1 })
        .limit(limit);
};

export const getExpiredReminderLogs = async ({ before = new Date(), limit = 200 } = {}) => {
    return TrackingLog.find({
        retryState: 'active',
        status: { $in: ['Pending', 'Alerted'] },
        confirmUntil: { $lte: before },
        missedNotifiedAt: null,
    })
        .sort({ confirmUntil: 1 })
        .limit(limit);
};

export const advanceReminderRetry = (log, now = new Date()) => {
    const attempts = Number(log.reminderAttempts || 0) + 1;
    const intervalMinutes = Number(log.reminderIntervalMinutes || DEFAULT_REMINDER_INTERVAL_MINUTES);
    const maxAttempts = Number(log.maxReminderAttempts || DEFAULT_MAX_REMINDER_ATTEMPTS);
    const isFinalAttempt = attempts >= maxAttempts;

    log.reminderAttempts = attempts;
    log.lastReminderSentAt = now;
    log.status = 'Alerted';
    log.retryState = 'active';
    log.nextReminderAt = isFinalAttempt
        ? null
        : new Date(now.getTime() + intervalMinutes * 60 * 1000);

    if (log.nextReminderAt && log.confirmUntil && log.nextReminderAt > log.confirmUntil) {
        log.nextReminderAt = log.confirmUntil;
    }

    return {
        isFinalAttempt,
        reminderAttempts: log.reminderAttempts,
        nextReminderAt: log.nextReminderAt,
    };
};

export const finalizeMissedReminder = (log, now = new Date()) => {
    log.status = 'Missed';
    log.retryState = 'expired';
    log.missedNotifiedAt = now;
    log.nextReminderAt = null;
    return log;
};
