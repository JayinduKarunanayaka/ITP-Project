import Appointment from "../model/Appointment.js";

// Add appointment
export const addAppointment = async (req, res) => {
    try {
        const targetUserId = req.body.patientId || req.body.userId;
        const appointment = new Appointment({ ...req.body, userId: targetUserId });
        await appointment.save();
        res.json({ success: true, message: "Appointment scheduled", appointment });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get all appointments
export const getAppointments = async (req, res) => {
    try {
        const targetUserId = req.query.patientId || req.body.userId;
        const appointments = await Appointment.find({ userId: targetUserId });
        res.json({ success: true, appointments });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update appointment
export const updateAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, message: "Appointment updated", appointment });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
    try {
        await Appointment.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Appointment deleted" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};