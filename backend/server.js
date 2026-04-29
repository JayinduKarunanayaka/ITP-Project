import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouts from "./routes/authRouts.js";
import dns from "node:dns";
import userRouter from "./routes/userRouts.js";
import adminRouter from './routes/adminRoutes.js';
import path from 'path';

// Import medical info management part
import bmiRouter from "./routes/bmiRoutes.js";
import medicationRouter from "./routes/medicationRoutes.js";
import appointmentRouter from "./routes/appointmentRoutes.js";
import recordRouter from "./routes/recordRoutes.js";
import allergyRouter from "./routes/allergyRoutes.js";
import scheduleRouter from "./routes/scheduleRoutes.js";
import prescriptionRouter from "./routes/prescriptionRoutes.js";
import trackingRouter from "./routes/trackingRoutes.js";
import initMissedDoseCron from "./jobs/missedDoseCron.js";
import initScheduledReminderCron from "./jobs/scheduledReminderCron.js";

//health notes & feedback module routes
import notesRouter from "./routes/notes.js";
import feedbackRouter from "./routes/feedbackRoutes.js";
import pushRouter from './routes/pushRoutes.js';

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const port = process.env.PORT || 4000
connectDB();

const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://127.0.0.1:5176', 'http://localhost:5177'];

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://127.0.0.1:5176',
        'http://localhost:5177'
    ],
    credentials: true
}));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

//API endpoints
app.get('/', (req, res) => res.send("API working fine"));
app.use('/api/auth', authRouts);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);

// medical module endpoints
app.use("/api/bmi", bmiRouter);
app.use("/api/medications", medicationRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/records", recordRouter);
app.use("/api/allergies", allergyRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/prescriptions", prescriptionRouter);
app.use("/api/tracking", trackingRouter);
app.use('/api/push', pushRouter);

//health notes and feedback endpoints
app.use('/api/notes', notesRouter);  //get/post/put/delete
app.use('/api/feedback', feedbackRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    
    // Initialize scheduled jobs
    initMissedDoseCron();
    initScheduledReminderCron();
});