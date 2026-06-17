import express from 'express';
import { 
    getAllPatients, 
    deleteUser, 
    verifySuperAdmin, 
    listAdmins, 
    createAdmin, 
    removeAdmin,
    getAuditLogs,
    getTrackingStats,
    getDeviceStats,
    getFeedbackStats
} from '../controller/adminController.js';
import userAuth from '../middleware/userAuth.js';
import adminAuth from '../middleware/adminAuth.js';

const adminRouter = express.Router();


adminRouter.post('/verify-super', verifySuperAdmin);
adminRouter.get('/list-admins', listAdmins);
adminRouter.post('/create-admin', createAdmin);
adminRouter.post('/remove-admin', removeAdmin);
adminRouter.get("/audit-logs", getAuditLogs); 
adminRouter.get('/all-patients', userAuth, adminAuth, getAllPatients);
adminRouter.get('/all-users', userAuth, adminAuth, getAllPatients);
adminRouter.post('/delete-user', userAuth, adminAuth, deleteUser);
adminRouter.get('/tracking-stats', userAuth, adminAuth, getTrackingStats);
adminRouter.get('/device-stats', userAuth, adminAuth, getDeviceStats);
adminRouter.get('/feedback-stats', userAuth, adminAuth, getFeedbackStats);

export default adminRouter;