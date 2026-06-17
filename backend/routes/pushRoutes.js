import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { registerPushToken, sendTestPushNotification, unregisterPushToken } from '../controller/pushController.js';
import { createDeviceLink, claimDeviceLink } from '../controller/deviceLinkController.js';

const router = express.Router();

router.post('/tokens', userAuth, registerPushToken);
router.delete('/tokens', userAuth, unregisterPushToken);
router.post('/test-notification', userAuth, sendTestPushNotification);
router.post('/device-link/create', userAuth, createDeviceLink);
router.post('/device-link/claim', claimDeviceLink);

export default router;
