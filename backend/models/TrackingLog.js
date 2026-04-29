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
        enum: ['Pending', 'Taken', 'Late', 'Missed', 'Skipped'],
        default: 'Pending',
        required: true
    },
    note: {
        type: String,
        default: ''
    }
}, { timestamps: true });

trackingLogSchema.index({ userId: 1, scheduledTime: -1 });
trackingLogSchema.index({ status: 1 });

const TrackingLog = mongoose.models.TrackingLog || mongoose.model('TrackingLog', trackingLogSchema);

export default TrackingLog;
