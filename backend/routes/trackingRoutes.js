import express from 'express';
import userAuth from '../middleware/userAuth.js';
import {
    recordIntake,
    getAdherence,
    getHistory,
    generateReport,
    getDetailedAdherence
} from '../controllers/trackingController.js';

const trackingRouter = express.Router();

// Record medication intake
trackingRouter.post('/record', userAuth, recordIntake);

// Get adherence metrics explicitly mapping to userId
trackingRouter.get('/adherence/:userId', userAuth, getAdherence);

// Get historical log list mapping to userId
trackingRouter.get('/history/:userId', userAuth, getHistory);

// Download generated map reports explicitly mapped to userId
trackingRouter.get('/report/:userId', userAuth, generateReport);

// Detailed Analytics mapping explicitly connected to userId
trackingRouter.get('/detailed-adherence/:userId', userAuth, getDetailedAdherence);

export default trackingRouter;
