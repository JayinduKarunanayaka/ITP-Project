import Record from "../model/Record.js";

// Add medical record
export const addRecord = async (req, res) => {
    try {
        const targetUserId = req.body.patientId || req.body.userId;
        const uploadData = req.file ? {
            fileUrl: `/uploads/${req.file.filename}`,
            originalFileName: req.file.originalname
        } : {};
        const record = new Record({ ...req.body, ...uploadData, userId: targetUserId });
        await record.save();
        res.json({ success: true, message: "Record added", record });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get all records
export const getRecords = async (req, res) => {
    try {
        const targetUserId = req.query.patientId || req.body.userId;
        const records = await Record.find({ userId: targetUserId });
        res.json({ success: true, records });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update medical record
export const updateRecord = async (req, res) => {
    try {
        const uploadData = req.file ? {
            fileUrl: `/uploads/${req.file.filename}`,
            originalFileName: req.file.originalname
        } : {};
        const record = await Record.findByIdAndUpdate(req.params.id, { ...req.body, ...uploadData }, { new: true });
        res.json({ success: true, message: "Record updated", record });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Delete medical record
export const deleteRecord = async (req, res) => {
    try {
        await Record.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Record deleted" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};