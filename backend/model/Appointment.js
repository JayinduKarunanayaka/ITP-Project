import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: String, required: true },
    doctorSpecialty: { type: String },
    hospitalName: { type: String },
    date: { type: Date, required: true },
    notes: { type: String },
    reminderLeadMinutes: { type: Number, default: 30 },
    reminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date, default: null }
}, { timestamps: true }); // auto adds createdAt + updatedAt

const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);

export default Appointment;