import Medication from "../model/Medication.js";
import { createTrackingSchedule, buildReminderWindow } from "../services/reminderLifecycleService.js";

const getTargetUserId = (req) =>
    req.query?.patientId ||
    req.params?.patientId ||
    req.body?.patientId ||
    req.query?.userId ||
    req.body?.userId;

// Add medication
export const addMedication = async (req, res) => {
    try {
        const targetUserId = getTargetUserId(req);
        if (!targetUserId) {
            return res.json({ success: false, message: "Patient ID is required" });
        }

        const med = new Medication({
            ...req.body,
            userId: targetUserId,
            patientId: req.body?.patientId || targetUserId,
            medicationName: req.body?.medicationName || req.body?.name,
            scheduleStartDate: req.body?.scheduleStartDate || null,
            scheduleEndDate: req.body?.scheduleEndDate || null,
        });
        await med.save();

        const reminderTime = (req.body?.scheduledTime || req.body?.time || "").toString().trim();
        if (reminderTime) {
            const reminderWindow = buildReminderWindow(reminderTime, {
                confirmWindowMinutes: req.body?.confirmWindowMinutes,
                reminderIntervalMinutes: req.body?.reminderIntervalMinutes,
                maxReminderAttempts: req.body?.maxReminderAttempts,
                startDate: req.body?.scheduleStartDate,
                endDate: req.body?.scheduleEndDate,
            });

            await createTrackingSchedule({
                userId: targetUserId,
                medicationId: med._id,
                medicationName: req.body?.name || req.body?.medicationName || "Medication",
                scheduledTime: reminderWindow?.scheduledTime || reminderTime,
                overrides: {
                    confirmWindowMinutes: req.body?.confirmWindowMinutes,
                    reminderIntervalMinutes: req.body?.reminderIntervalMinutes,
                    maxReminderAttempts: req.body?.maxReminderAttempts,
                    startDate: req.body?.scheduleStartDate,
                    endDate: req.body?.scheduleEndDate,
                },
            });
        }

        res.json({ success: true, message: "Medication added", med });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get medications by type
export const getMedications = async (req, res) => {
    try {
        const { type, includeInventory } = req.query; // ?type=regular or ?type=occasional
        const targetUserId = getTargetUserId(req);

        if (!targetUserId) {
            return res.json({ success: false, message: "Patient ID is required" });
        }

        let query = { userId: targetUserId };
        if (type) query.type = type;
        
        if (includeInventory !== 'true') {
            query.isInventoryOnly = { $ne: true };
        }

        const meds = await Medication.find(query);
        res.json({ success: true, meds });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update medication
export const updateMedication = async (req, res) => {
    try {
        const updateData = { ...req.body };
        // Prevents overwriting the medication owner if Caretaker performs the update
        delete updateData.userId;
        delete updateData.patientId;

        const med = await Medication.findByIdAndUpdate(req.params.id, updateData, { new: true });

        const ownerId = med?.patientId || med?.userId;
        const reminderTime = (updateData?.scheduledTime || updateData?.time || med?.time || "").toString().trim();
        if (ownerId && reminderTime && (updateData?.time || updateData?.scheduledTime || updateData?.scheduleStartDate || updateData?.scheduleEndDate)) {
            const reminderWindow = buildReminderWindow(reminderTime, {
                confirmWindowMinutes: updateData?.confirmWindowMinutes,
                reminderIntervalMinutes: updateData?.reminderIntervalMinutes,
                maxReminderAttempts: updateData?.maxReminderAttempts,
                startDate: updateData?.scheduleStartDate || med?.scheduleStartDate,
                endDate: updateData?.scheduleEndDate || med?.scheduleEndDate,
            });

            await createTrackingSchedule({
                userId: ownerId,
                medicationId: med._id,
                medicationName: med.medicationName || med.name || "Medication",
                scheduledTime: reminderWindow?.scheduledTime || reminderTime,
                overrides: {
                    confirmWindowMinutes: updateData?.confirmWindowMinutes,
                    reminderIntervalMinutes: updateData?.reminderIntervalMinutes,
                    maxReminderAttempts: updateData?.maxReminderAttempts,
                    startDate: updateData?.scheduleStartDate || med?.scheduleStartDate,
                    endDate: updateData?.scheduleEndDate || med?.scheduleEndDate,
                },
            });
        }

        res.json({ success: true, message: "Medication updated", med });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Delete medication
export const deleteMedication = async (req, res) => {
    try {
        await Medication.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Medication deleted" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};