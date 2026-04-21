import Medication from "../model/Medication.js";

// Add medication
export const addMedication = async (req, res) => {
    try {
        const targetUserId = req.body.patientId || req.body.userId;
        const med = new Medication({ ...req.body, userId: targetUserId });
        await med.save();
        res.json({ success: true, message: "Medication added", med });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get medications by type
export const getMedications = async (req, res) => {
    try {
        const { type, patientId, includeInventory } = req.query; // ?type=regular or ?type=occasional
        const targetUserId = patientId || req.body.userId;

        let query = { userId: targetUserId };
        if (type) query.type = type;
        
        if (includeInventory !== 'true') {
            query.isInventoryOnly = { $ne: true };
        }

        const meds = await Medication.find(query);
        res.json({ success: true, meds });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update medication
export const updateMedication = async (req, res) => {
    try {
        const updateData = { ...req.body };
        // Prevents overwriting the medication owner if Caretaker performs the update
        delete updateData.userId;

        const med = await Medication.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ success: true, message: "Medication updated", med });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Delete medication
export const deleteMedication = async (req, res) => {
    try {
        await Medication.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Medication deleted" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};