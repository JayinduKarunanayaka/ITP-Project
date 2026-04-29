import express from "express";
import userAuth from "../middleware/userAuth.js";
import upload from "../middleware/upload.js";
import { addPrescription, getPrescriptions } from "../controller/prescriptionController.js";

const prescriptionRouter = express.Router();

prescriptionRouter.post("/", userAuth, upload.single('file'), addPrescription);
prescriptionRouter.get("/", userAuth, getPrescriptions);

export default prescriptionRouter;
