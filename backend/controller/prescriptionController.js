import Prescription from "../model/Prescription.js";

// Add a prescription
export const addPrescription = async (req, res) => {
    try {
        const targetUserId = req.body.patientId || req.userId || req.body.userId; // userAuth middleware sets req.userId and body.userId

        let name = req.body.name;
        const note = req.body.note;

        if (!req.file) {
            return res.json({ success: false, message: "No file uploaded" });
        }

        // if name is not provided or empty, fallback to the original file name
        if (!name || name.trim() === '') {
            name = req.file.originalname;
        }

        // Create the fileUrl based on the saved filename from Multer
        const fileUrl = `/uploads/${req.file.filename}`;

        const prescription = new Prescription({
            userId: targetUserId,
            name,
            note,
            fileUrl,
            category: req.body.category || 'General'
        });

        await prescription.save();
        res.json({ success: true, message: "Prescription added successfully", prescription });
    } catch (error) {
        console.error("Add Prescription Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Get prescriptions for a specific user
export const getPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.query;
        const targetUserId = patientId || req.userId || req.body.userId;

        const prescriptions = await Prescription.find({ userId: targetUserId }).sort({ uploadDate: -1 });
        res.json({ success: true, prescriptions });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update a prescription
export const updatePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, note, category } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (note !== undefined) updateData.note = note;
        if (category) updateData.category = category;

        const updatedPrescription = await Prescription.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedPrescription) {
            return res.json({ success: false, message: "Prescription not found" });
        }

        res.json({ success: true, message: "Prescription updated successfully", prescription: updatedPrescription });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Delete a prescription
export const deletePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPrescription = await Prescription.findByIdAndDelete(id);

        if (!deletedPrescription) {
            return res.json({ success: false, message: "Prescription not found" });
        }

        res.json({ success: true, message: "Prescription deleted successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
