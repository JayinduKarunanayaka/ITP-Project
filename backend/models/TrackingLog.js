import mongoose from 'mongoose';

const trackingLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    medicationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'medication'
    },
    medicationName: {
        type: String,
        required: true
    },
    scheduledTime: {
        type: Date,
        required: true
    },
    takenTime: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['Pending', 'Taken', 'Late', 'Missed', 'Skipped', 'Alerted'],
        default: 'Pending',
        required: true
    },
    note: {
        type: String,
        default: ''
    },
    confirmUntil: {
        type: Date,
        default: null
    },
    reminderAttempts: {
        type: Number,
        default: 0
    },
    maxReminderAttempts: {
        type: Number,
        default: 4
    },
    reminderIntervalMinutes: {
        type: Number,
        default: 3
    },
    lastReminderSentAt: {
        type: Date,
        default: null
    },
    nextReminderAt: {
        type: Date,
        default: null
    },
    missedNotifiedAt: {
        type: Date,
        default: null
    },
    retryState: {
        type: String,
        enum: ['none', 'active', 'completed', 'expired'],
        default: 'none'
    },
    customMessage: {
        type: String,
        default: null
    },
    customAudio: {
        type: String,
        default: null
    }
}, { timestamps: true });

trackingLogSchema.index({ userId: 1, scheduledTime: -1 });
trackingLogSchema.index({ status: 1 });
trackingLogSchema.index({ nextReminderAt: 1, status: 1 });
trackingLogSchema.index({ confirmUntil: 1, status: 1 });

const TrackingLog = mongoose.models.TrackingLog || mongoose.model('TrackingLog', trackingLogSchema);

export default TrackingLog;
