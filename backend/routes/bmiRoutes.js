import express from "express";
import userAuth from "../middleware/userAuth.js";
import { addBMI, getBMI, updateBMI, deleteBMI } from "../controller/bmiController.js";

const bmiRouter = express.Router();

bmiRouter.post("/", userAuth, addBMI);
bmiRouter.get("/", userAuth, getBMI);
bmiRouter.put("/:id", userAuth, updateBMI);
bmiRouter.delete("/:id", userAuth, deleteBMI);

export default bmiRouter;