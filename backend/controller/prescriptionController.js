import Prescription from "../model/Prescription.js";

// Add a prescription
export const addPrescription = async (req, res) => {
    try {
        const targetUserId = req.body.patientId || req.body.userId; // userAuth middleware sets body.userId

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
            fileUrl
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
        const targetUserId = patientId || req.body.userId;

        const prescriptions = await Prescription.find({ userId: targetUserId }).sort({ uploadDate: -1 });
        res.json({ success: true, prescriptions });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
