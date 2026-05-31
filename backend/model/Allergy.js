import mongoose from "mongoose";

const allergySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hasAllergies: { type: Boolean, default: true },
    type: { type: String, enum: ["Food", "Medication", "Environmental", "Other"] },
    allergen: { type: String },
    severity: { type: String, enum: ["Mild", "Moderate", "Severe"] },
    reaction: { type: String }
}, { timestamps: true });

const Allergy = mongoose.models.Allergy || mongoose.model("Allergy", allergySchema);

export default Allergy;
