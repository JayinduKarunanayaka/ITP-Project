import BMI from "../model/BMI.js";

// Add BMI entry
export const addBMI = async (req, res) => {
    try {
        const { height, weight, patientId, userId } = req.body;
        const targetUserId = patientId || userId;
        const value = (weight / ((height / 100) ** 2)).toFixed(2);
        const status = value < 18.5 ? "Underweight" :
            value < 24.9 ? "Normal" :
                value < 29.9 ? "Overweight" : "Obese";

        const bmi = new BMI({ userId: targetUserId, height, weight, value, status });
        await bmi.save();
        res.json({ success: true, message: "BMI recorded", bmi });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get all BMI history
export const getBMI = async (req, res) => {
    try {
        const targetUserId = req.query.patientId || req.body.userId;
        const bmis = await BMI.find({ userId: targetUserId }).sort({ createdAt: 1 });
        res.json({ success: true, bmis });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update BMI entry
export const updateBMI = async (req, res) => {
    try {
        const { height, weight } = req.body;
        const value = (weight / ((height / 100) ** 2)).toFixed(2);
        const status = value < 18.5 ? "Underweight" :
            value < 24.9 ? "Normal" :
                value < 29.9 ? "Overweight" : "Obese";

        const bmi = await BMI.findByIdAndUpdate(req.params.id, { height, weight, value, status }, { new: true });
        res.json({ success: true, message: "BMI updated", bmi });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Delete BMI entry
export const deleteBMI = async (req, res) => {
    try {
        await BMI.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "BMI deleted" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};