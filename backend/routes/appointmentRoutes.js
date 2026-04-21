import express from "express";
import userAuth from "../middleware/userAuth.js";
import { addAppointment, getAppointments, updateAppointment, deleteAppointment } from "../controller/appointmentController.js";

const appointmentRouter = express.Router();

appointmentRouter.post("/", userAuth, addAppointment);
appointmentRouter.get("/", userAuth, getAppointments);
appointmentRouter.put("/:id", userAuth, updateAppointment);
appointmentRouter.delete("/:id", userAuth, deleteAppointment);

export default appointmentRouter;