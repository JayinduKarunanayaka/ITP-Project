import mongoose from 'mongoose';

const deviceTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    pushToken: { type: String, required: true },
    deviceType: { type: String, default: 'unknown' },
    platform: { type: String, default: '' },
    lastActive: { type: Date, default: Date.now },
}, { timestamps: true });

// Ensure a user can have multiple devices but avoid duplicate pushToken entries
deviceTokenSchema.index({ userId: 1, pushToken: 1 }, { unique: true });

const DeviceToken = mongoose.models.DeviceToken || mongoose.model('DeviceToken', deviceTokenSchema);

export default DeviceToken;

