import express from "express";
import userAuth from "../middleware/userAuth.js";
import { addAllergy, getAllergies, updateAllergy, deleteAllergy } from "../controller/allergyController.js";

const allergyRouter = express.Router();

allergyRouter.post("/", userAuth, addAllergy);
allergyRouter.get("/", userAuth, getAllergies);
allergyRouter.put("/:id", userAuth, updateAllergy);
allergyRouter.delete("/:id", userAuth, deleteAllergy);

export default allergyRouter;
