import Feedback from '../model/Feedback.js';

// Create a new feedback
export const createFeedback = async (req, res) => {
    try {
        const { type, rating, description, date, status, userId, userName } = req.body;

        const newFeedback = new Feedback({
            type,
            rating,
            description,
            date: date || new Date().toLocaleDateString('en-US'),
            status: status || 'Pending',
            userId: userId || 'Anonymous',
            userName: userName || 'Anonymous'
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
        const query = {};
        if (req.query.userId) {
            query.userId = req.query.userId;
        }

        const feedbacks = await Feedback.find(query).sort({ createdAt: -1 });
        res.status(200).json(feedbacks);
    } catch (error) {
        console.error('Error in getAllFeedback:', error);
        res.status(500).json({ message: 'Error retrieving feedback', error: error.message });
    }
};

// Get single feedback by ID
export const getFeedbackById = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
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
