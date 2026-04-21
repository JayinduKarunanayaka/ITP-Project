import jwt from 'jsonwebtoken';
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    birthday: { type: Date, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "Patient" },
    caretakerId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null },
    gender: { type: String, default: "" },
    height: { type: Number, default: 0 }, 
    weight: { type: Number, default: 0 }, 
    primaryLanguage: { type: String, default: "" },
    serviceArea: { type: String },
    province: { type: String },
    city: { type: String },
    address: { type: String },
    skills: { type: String },
    patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'patient' }],
    mobile: { type: String, default: '' },
    insuranceProvider: { type: String, default: "" },
    pharmacyNumber: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    verifyOtp:{type: String, default:''},
    verifyOtpExpireAt:{type: Number, default: 0},
    isAccountVerified:{type: Boolean, default: false},
    resetOtp:{type: String, default: ''},
    resetOtpExpireAt:{type: Number, default: 0},
}, { timestamps: true });

const userModel = mongoose.model.user || mongoose.model('user',userSchema);

export default userModel;