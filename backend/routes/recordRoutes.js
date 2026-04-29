import express from "express";
import userAuth from "../middleware/userAuth.js";
import { addRecord, getRecords, updateRecord, deleteRecord } from "../controller/recordController.js";
import upload from "../middleware/upload.js";

const recordRouter = express.Router();

recordRouter.post("/", userAuth, upload.single('file'), addRecord);
recordRouter.get("/", userAuth, getRecords);
recordRouter.put("/:id", userAuth, upload.single('file'), updateRecord);
recordRouter.delete("/:id", userAuth, deleteRecord);

export default recordRouter;