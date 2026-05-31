import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    name: { type: String, required: false },
    dosage: { type: String, required: false },
    type: { type: String, enum: ["regular", "occasional"], required: false },
    dateStarted: { type: Date, required: false },
    frequency: { type: String, required: false },
    indication: { type: String, required: false },

    // Additional fields from routes.js
    patientName: { type: String, required: false },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    medicationName: { type: String, required: false },
    tablets: { type: Number, required: false, default: 1 },
    time: { type: String, required: false },
    status: { type: String, required: false, default: 'active' },
    lastTaken: { type: Date, required: false },
    notificationSent: { type: Boolean, required: false, default: false },
    stockCount: { type: Number, required: false, default: 0 },
    expiryDate: { type: Date, required: false }
}, { timestamps: true }); // auto adds createdAt + updatedAt

const Medication = mongoose.models.Medication || mongoose.model("Medication", medicationSchema);

export default Medication;