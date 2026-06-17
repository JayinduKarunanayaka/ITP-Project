import mongoose from 'mongoose';

const deviceLinkSchema = new mongoose.Schema({
    linkCode: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    deviceId: { type: String, default: '' },
    platform: { type: String, default: '' },
    deviceType: { type: String, default: 'mobile' },
    status: { type: String, enum: ['pending', 'claimed', 'expired'], default: 'pending' },
    expiresAt: { type: Date, required: true },
    claimedAt: { type: Date, default: null },
}, { timestamps: true });

deviceLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const DeviceLink = mongoose.models.DeviceLink || mongoose.model('DeviceLink', deviceLinkSchema);

export default DeviceLink;

