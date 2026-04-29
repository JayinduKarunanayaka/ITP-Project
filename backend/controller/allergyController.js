import Allergy from "../model/Allergy.js";

// Add new allergy record
export const addAllergy = async (req, res) => {
    try {
        const targetUserId = req.body.patientId || req.body.userId;
        const allergy = new Allergy({ ...req.body, userId: targetUserId });
        await allergy.save();
        res.json({ success: true, message: "Allergy record added", allergy });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get all allergies for a user
export const getAllergies = async (req, res) => {
    try {
        const targetUserId = req.query.patientId || req.body.userId;
        const allergies = await Allergy.find({ userId: targetUserId });
        res.json({ success: true, allergies });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update an allergy record
export const updateAllergy = async (req, res) => {
    try {
        const allergy = await Allergy.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, message: "Allergy record updated", allergy });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Delete an allergy record
export const deleteAllergy = async (req, res) => {
    try {
        await Allergy.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Allergy record deleted" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
