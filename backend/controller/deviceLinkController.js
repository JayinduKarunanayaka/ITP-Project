import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import DeviceLink from '../model/DeviceLink.js';
import DeviceToken from '../models/DeviceToken.js';
import userModel from '../model/userModel.js';

const makeLinkCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();
const buildAuthPayload = async (user) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return {
        token,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isAccountVerified: user.isAccountVerified,
        },
    };
};

export const createDeviceLink = async (req, res) => {
    try {
        const userId = req.body.userId || req.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const linkCode = makeLinkCode();

        const link = await DeviceLink.create({
            linkCode,
            userId,
            status: 'pending',
            expiresAt,
        });

        return res.status(201).json({
            success: true,
            message: 'Device link created',
            linkCode: link.linkCode,
            expiresAt: link.expiresAt,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const claimDeviceLink = async (req, res) => {
    try {
        const { linkCode, deviceId, platform, deviceType, pushToken } = req.body;

        if (!linkCode || !pushToken) {
            return res.status(400).json({ success: false, message: 'Missing linkCode or pushToken' });
        }

        const link = await DeviceLink.findOne({ linkCode, status: 'pending' });
        if (!link) {
            return res.status(404).json({ success: false, message: 'Invalid or expired link code' });
        }

        if (link.expiresAt < new Date()) {
            link.status = 'expired';
            await link.save();
            return res.status(400).json({ success: false, message: 'Link code expired' });
        }

        link.status = 'claimed';
        link.deviceId = deviceId || '';
        link.platform = platform || '';
        link.deviceType = deviceType || 'mobile';
        link.claimedAt = new Date();
        await link.save();

        const device = await DeviceToken.findOneAndUpdate(
            { userId: link.userId, pushToken },
            {
                $set: {
                    userId: link.userId,
                    pushToken,
                    deviceType: deviceType || 'mobile',
                    platform: platform || '',
                    lastActive: new Date(),
                    deviceId: deviceId || '',
                    linkStatus: 'linked',
                    linkedAt: new Date(),
                },
            },
            { new: true, upsert: true }
        );

        const user = await userModel.findById(link.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Linked user not found' });
        }

        const authPayload = await buildAuthPayload(user);

        return res.status(200).json({
            success: true,
            message: 'Device linked successfully',
            userId: String(link.userId),
            device,
            ...authPayload,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

