import express from "express";
import userAuth from "../middleware/userAuth.js";
import { addMedication, getMedications, updateMedication, deleteMedication } from "../controller/medicationController.js";

const medicationRouter = express.Router();

medicationRouter.post("/", userAuth, addMedication);
medicationRouter.get("/", userAuth, getMedications);
medicationRouter.put("/:id", userAuth, updateMedication);
medicationRouter.delete("/:id", userAuth, deleteMedication);

export default medicationRouter;