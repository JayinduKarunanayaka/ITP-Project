import express from "express";
import userAuth from "../middleware/userAuth.js";
import { addMedication, getMedications, updateMedication, deleteMedication } from "../controller/medicationController.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const medicationRouter = express.Router();

medicationRouter.post("/", userAuth, upload.single('customAudioFile'), addMedication);
medicationRouter.get("/", userAuth, getMedications);
medicationRouter.put("/:id", userAuth, upload.single('customAudioFile'), updateMedication);
medicationRouter.delete("/:id", userAuth, deleteMedication);

export default medicationRouter;