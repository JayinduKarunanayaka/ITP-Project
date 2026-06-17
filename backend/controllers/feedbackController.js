import Feedback from '../model/Feedback.js';
import userModel from '../model/userModel.js';

const getRequester = async (req) => {
    const userId = req.userId || req.body?.userId;
    if (!userId) return null;

    const user = await userModel.findById(userId).lean();
    return user || null;
};

// Create a new feedback
export const createFeedback = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) {
            return res.status(401).json({ message: 'Not Authorized. Login Again!' });
        }

        const { type, rating, description, date, status, userName } = req.body;

        const newFeedback = new Feedback({
            type,
            rating,
            description,
            date: date || new Date().toLocaleDateString('en-US'),
            status: status || 'Pending',
            userId: String(requester._id),
            userName: userName?.trim() || requester.name || 'Anonymous'
        });

        const savedFeedback = await newFeedback.save();
        res.status(201).json(savedFeedback);
    } catch (error) {
        console.error('Error in createFeedback:', error);
        res.status(500).json({ message: 'Error creating feedback', error: error.message });
    }
};

// Get all feedbacks
export const getAllFeedback = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) {
            return res.status(401).json({ message: 'Not Authorized. Login Again!' });
        }

        const query = requester.role === 'Admin' ? {} : { userId: String(requester._id) };
        const feedbacks = await Feedback.find(query).sort({ createdAt: -1 });
        res.status(200).json(feedbacks);
    } catch (error) {
        console.error('Error in getAllFeedback:', error);
        res.status(500).json({ message: 'Error retrieving feedback', error: error.message });
    }
};

// Get all feedback for public home page
export const getPublicFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({})
            .sort({ createdAt: -1 })
            .select('userName type rating description createdAt status');

        res.status(200).json(feedbacks);
    } catch (error) {
        console.error('Error in getPublicFeedback:', error);
        res.status(500).json({ message: 'Error retrieving public feedback', error: error.message });
    }
};

// Get single feedback by ID
export const getFeedbackById = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) {
            return res.status(401).json({ message: 'Not Authorized. Login Again!' });
        }

        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        if (requester.role !== 'Admin' && String(feedback.userId) !== String(requester._id)) {
            return res.status(403).json({ message: 'Not allowed to view this feedback' });
        }

        res.status(200).json(feedback);
    } catch (error) {
        console.error('Error in getFeedbackById:', error);
        res.status(500).json({ message: 'Error retrieving feedback', error: error.message });
    }
};

// Update feedback
export const updateFeedback = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) {
            return res.status(401).json({ message: 'Not Authorized. Login Again!' });
        }

        const existingFeedback = await Feedback.findById(req.params.id).lean();
        if (!existingFeedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        if (requester.role !== 'Admin' && String(existingFeedback.userId) !== String(requester._id)) {
            return res.status(403).json({ message: 'Not allowed to edit this feedback' });
        }

        const updatedFeedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedFeedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        res.status(200).json(updatedFeedback);
    } catch (error) {
        console.error('Error in updateFeedback:', error);
        res.status(500).json({ message: 'Error updating feedback', error: error.message });
    }
};

// Delete feedback
export const deleteFeedback = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) {
            return res.status(401).json({ message: 'Not Authorized. Login Again!' });
        }

        const existingFeedback = await Feedback.findById(req.params.id).lean();
        if (!existingFeedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        if (requester.role !== 'Admin' && String(existingFeedback.userId) !== String(requester._id)) {
            return res.status(403).json({ message: 'Not allowed to delete this feedback' });
        }

        const deletedFeedback = await Feedback.findByIdAndDelete(req.params.id);
        if (!deletedFeedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        res.status(200).json({ message: 'Feedback deleted successfully' });
    } catch (error) {
        console.error('Error in deleteFeedback:', error);
        res.status(500).json({ message: 'Error deleting feedback', error: error.message });
    }
};
