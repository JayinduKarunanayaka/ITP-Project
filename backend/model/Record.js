import mongoose from "mongoose";

const recordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    diagnosis: { type: String, required: true },
    notes: { type: String },
    fileUrl: { type: String },
    originalFileName: { type: String }
}, { timestamps: true }); // auto adds createdAt + updatedAt

const Record = mongoose.models.Record || mongoose.model("Record", recordSchema);

export default Record;