import mongoose from "mongoose";

const auditSchema = new mongoose.Schema({
    adminId: { type: String, required: true },
    adminName: { type: String, required: true },
    adminEmail: { type: String, required: true },
    action: { type: String, required: true }, 
    targetId: { type: String }, 
    createdAt: { type: Date, default: Date.now }
});

const auditModel = mongoose.models.audit || mongoose.model("audit", auditSchema);

export default auditModel;