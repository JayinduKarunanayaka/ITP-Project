import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { getUserData, updateUserData, deactivateAccount, addPatientToCaretaker, getCaretakerPatients, createAndLinkPatient, removePatientFromCaretaker, getPatientById, updatePatient } from '../controller/userController.js';

const userRouter = express.Router();

userRouter.get('/data',userAuth,getUserData);
userRouter.post('/update-data', userAuth, updateUserData);
userRouter.post('/deactivate', userAuth, deactivateAccount);
userRouter.post('/add-patient', userAuth, addPatientToCaretaker);
userRouter.get('/my-patients', userAuth, getCaretakerPatients); 
userRouter.post('/create-patient', userAuth, createAndLinkPatient);
userRouter.post('/remove-patient', userAuth, removePatientFromCaretaker);
userRouter.post('/get-patient-by-id', userAuth, getPatientById);
userRouter.post('/update-patient', userAuth, updatePatient);
userRouter.get('/get-patient/:patientId', userAuth, getPatientById);
userRouter.get('/get-patient-by-id/:patientId', getPatientById);

export default userRouter;