import userModel from "../model/userModel.js";
import auditModel from "../model/auditModel.js"; 
import TrackingLog from "../models/TrackingLog.js";
import DeviceLink from "../model/DeviceLink.js";
import Feedback from "../model/Feedback.js";
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Audit Log Retrieval
export const getAuditLogs = async (req, res) => {
    try {
        const logs = await auditModel.find({}).sort({ createdAt: -1 });
        res.json({ success: true, logs });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Create New Admin & Log Action 
export const createAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const currentAdminId = req.body.userId; 

        const exists = await userModel.findOne({ email });
        if (exists) return res.json({ success: false, message: "Admin already exists" });

        const adminUser = await userModel.findById(currentAdminId);

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new userModel({
            email,
            password: hashedPassword,
            role: 'Admin', 
            isAccountVerified: true,
            name: "System Admin",
            birthday: "1900-01-01",
            gender: "Not Specified",
            height: 0,
            weight: 0
        });

        await newAdmin.save();

        await auditModel.create({
            adminId: currentAdminId || "SUPER_ADMIN",
            adminName: adminUser ? adminUser.name : "Super Admin",
            adminEmail: adminUser ? adminUser.email : "master@admin.com", 
            action: "CREATE_ADMIN",
            targetId: email,
        });

        res.json({ success: true, message: "Admin Created" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Remove Admin
export const removeAdmin = async (req, res) => {
    try {
        const { adminId } = req.body; 
        const currentAdminId = req.body.userId; 

        const targetAdmin = await userModel.findOne({ _id: adminId, role: 'Admin' });
        const adminUser = await userModel.findById(currentAdminId);
        
        if (!targetAdmin) {
            return res.json({ success: false, message: "Admin not found or invalid role" });
        }

        await userModel.findByIdAndDelete(adminId);

        await auditModel.create({
            adminId: currentAdminId || "SUPER_ADMIN",
            adminName: adminUser ? adminUser.name : "Super Admin",
            adminEmail: adminUser ? adminUser.email : "master@admin.com",
            action: "REMOVE_ADMIN",
            targetId: targetAdmin.email,
        });

        res.json({ success: true, message: "Admin removed successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Super Admin Verification 
export const verifySuperAdmin = async (req, res) => {
    try {
        const { masterKey } = req.body;
        const hashedInput = crypto.createHash('sha256').update(masterKey).digest('hex');
        const secureHash = process.env.SUPER_ADMIN_HASH;

        if (hashedInput === secureHash) {
            res.json({ success: true, message: "Master Access Granted" });
        } else {
            res.json({ success: false, message: "Invalid Security PIN" });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

//List All Admins 
export const listAdmins = async (req, res) => {
    try {
        const admins = await userModel.find({ role: 'Admin' }).select('-password');
        res.json({ success: true, admins });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Patient Management (STRICT ROLE CHECK) 
export const getAllPatients = async (req, res) => {
    try {
        const users = await userModel.find({ 
            role: { $in: ['Patient', 'Caretaker'] } 
        }).select('-password');
        
        res.json({ success: true, users });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

//delete paatient using admin
export const deleteUser = async (req, res) => {
    try {
        const { targetUserId } = req.body; 
        const adminId = req.body.userId;

        if (!targetUserId) return res.json({ success: false, message: "Target User ID is required" });

        const targetUser = await userModel.findById(targetUserId);
        const adminUser = await userModel.findById(adminId);

        if (!targetUser) {
            return res.json({ success: false, message: "User not found" });
        }

        if (targetUser.role === 'Admin') {
            return res.json({ 
                success: false, 
                message: "Security: Cannot delete an Admin from the Patient tab." 
            });
        }

        await userModel.findByIdAndDelete(targetUserId);
        
        await auditModel.create({
            adminId: adminId, 
            adminName: adminUser ? adminUser.name : "System Admin",
            adminEmail: adminUser ? adminUser.email : "unknown@admin.com",
            action: "DELETE_PATIENT",
            targetId: targetUser.email,
        });

        res.json({ success: true, message: "Patient account removed successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get Global Tracking Stats
export const getTrackingStats = async (req, res) => {
    try {
        const stats = await TrackingLog.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            Pending: 0,
            Taken: 0,
            Late: 0,
            Missed: 0,
            Skipped: 0,
            Alerted: 0
        };

        stats.forEach(stat => {
            if (formattedStats[stat._id] !== undefined) {
                formattedStats[stat._id] = stat.count;
            }
        });

        res.json({ success: true, stats: formattedStats });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get Device Links Stats
export const getDeviceStats = async (req, res) => {
    try {
        const stats = await DeviceLink.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            claimed: 0,
            pending: 0,
            expired: 0
        };

        stats.forEach(stat => {
            if (formattedStats[stat._id] !== undefined) {
                formattedStats[stat._id] = stat.count;
            }
        });

        res.json({ success: true, stats: formattedStats });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get Feedback Stats
export const getFeedbackStats = async (req, res) => {
    try {
        const stats = await Feedback.aggregate([
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            'Bug Report': 0,
            'Feature Request': 0,
            'Improvement': 0,
            'Complaint': 0,
            'Praise': 0
        };

        stats.forEach(stat => {
            if (formattedStats[stat._id] !== undefined) {
                formattedStats[stat._id] = stat.count;
            }
        });

        res.json({ success: true, stats: formattedStats });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};