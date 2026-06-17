import Appointment from "../model/Appointment.js";

// Add appointment
export const addAppointment = async (req, res) => {
    try {
        const targetUserId = req.body.patientId || req.body.userId;
        const appointment = new Appointment({
            ...req.body,
            userId: targetUserId,
            reminderLeadMinutes: Number.isFinite(Number(req.body.reminderLeadMinutes))
                ? Number(req.body.reminderLeadMinutes)
                : 30,
            reminderSent: false,
            reminderSentAt: null,
        });
        await appointment.save();
        res.json({ success: true, message: "Appointment scheduled", appointment });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get all appointments
export const getAppointments = async (req, res) => {
    try {
        const targetUserId = req.query.patientId || req.query.userId || req.body.userId || req.user?._id;
        if (!targetUserId) {
            return res.json({ success: false, message: "Missing user identifier" });
        }
        const appointments = await Appointment.find({ userId: targetUserId }).sort({ date: 1 });
        res.json({ success: true, appointments });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update appointment
export const updateAppointment = async (req, res) => {
    try {
        const existingAppointment = await Appointment.findById(req.params.id).lean();
        if (!existingAppointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        const updates = { ...req.body };
        if (!updates.userId) {
            updates.userId = existingAppointment.userId;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'date')) {
            updates.reminderSent = false;
            updates.reminderSentAt = null;
        }
        const appointment = await Appointment.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
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