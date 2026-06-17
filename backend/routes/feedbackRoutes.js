import express from 'express';
import userAuth from '../middleware/userAuth.js';
import {
    createFeedback,
    getAllFeedback,
    getPublicFeedback,
    getFeedbackById,
    updateFeedback,
    deleteFeedback
} from '../controllers/feedbackController.js';

const router = express.Router();

router.get('/public', getPublicFeedback);
router.post('/', userAuth, createFeedback); //create
router.get('/', userAuth, getAllFeedback);
router.get('/:id', userAuth, getFeedbackById);
router.put('/:id', userAuth, updateFeedback); //update
router.delete('/:id', userAuth, deleteFeedback);

export default router;
