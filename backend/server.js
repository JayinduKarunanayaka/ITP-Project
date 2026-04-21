import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouts from "./routes/authRouts.js";
import dns from "node:dns";
import userRouter from "./routes/userRouts.js";
import adminRouter from './routes/adminRoutes.js';

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const port = process.env.PORT || 4000
connectDB();

const allowedOrigins = ['http://localhost:5173']

app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: allowedOrigins , credentials: true}))

//API endpoints
app.get('/',(req,res)=> res.send("API working fine"));
app.use('/api/auth',authRouts);
app.use('/api/user',userRouter);
app.use('/api/admin', adminRouter);

app.listen(port, ()=> console.log(`Server is running on port ${port}`));