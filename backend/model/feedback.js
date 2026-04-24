import mongoose from 'mongoose';

//define feedback doc schema structure
const FeedbackSchema = new mongoose.Schema({
    userId: { type: String, required: false },
    userName: { type: String, required: false, default: 'Anonymous' },
    type: {
        type: String,
        enum: ['Bug Report', 'Feature Request', 'Improvement', 'Complaint', 'Praise'],
        required: true
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    description: { type: String, required: true },
    date: { type: String, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Resolved'],
        default: 'Pending'
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Feedback', FeedbackSchema);
