import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    note: { type: String, required: false },
    fileUrl: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now }
}, { timestamps: true });

const Prescription = mongoose.models.Prescription || mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
