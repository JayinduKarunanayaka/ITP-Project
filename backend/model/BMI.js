import mongoose from "mongoose";

const bmiSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    value: { type: Number, required: true }, // calculated BMI
    status: { type: String, required: true } // e.g. Underweight, Normal, Overweight, Obese
}, { timestamps: true }); // auto adds createdAt + updatedAt

const BMI = mongoose.models.BMI || mongoose.model("BMI", bmiSchema);

export default BMI;