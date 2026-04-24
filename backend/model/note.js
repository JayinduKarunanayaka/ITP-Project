import mongoose from 'mongoose';

//define health note doc schema structure
const NoteSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    category: {
        type: String,
        enum: ['Symptom', 'Appointment', 'Medication', 'Vital Signs', 'General'],
        default: 'General'
    },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    mood: {
        type: String,
        enum: ['Great', 'Good', 'Neutral', 'Poor', 'Terrible'],
        default: 'Neutral'
    },
    physicalCondition: {
        type: String,
        enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'],
        default: 'Good'
    },
    severity: {
        type: String,
        enum: ['Mild', 'Moderate', 'Severe', 'Critical'],
        default: 'Mild'
    },
    notes: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Note', NoteSchema);