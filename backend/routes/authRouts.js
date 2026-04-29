import express from 'express';
import { exchangeSession, isAuthenticated, login, logout, register, resetPassword, sendResteOtp, sendVerifyOtp, verifyEmail, seedAdmin } from '../controller/authController.js';
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

//Routs
authRouter.post('/register',register);
authRouter.post('/login',login);
authRouter.post('/logout',logout);
authRouter.post('/send-verify-otp',userAuth,sendVerifyOtp);
authRouter.post('/verify-account',userAuth,verifyEmail);
authRouter.get('/is-auth',userAuth,isAuthenticated);
authRouter.post('/exchange-session', exchangeSession);
authRouter.post('/send-reset-otp',sendResteOtp);
authRouter.post('/reset-password',resetPassword);
authRouter.post('/seed-admin', seedAdmin);

export default authRouter;