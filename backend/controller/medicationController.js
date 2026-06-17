import Medication from "../model/Medication.js";
import { createTrackingSchedule, buildReminderWindow } from "../services/reminderLifecycleService.js";

const getTargetUserId = (req) =>
    req.query?.patientId ||
    req.params?.patientId ||
    req.body?.patientId ||
    req.query?.userId ||
    req.userId ||
    req.body?.userId;

// Add medication
export const addMedication = async (req, res) => {
    try {
        const targetUserId = getTargetUserId(req);
        if (!targetUserId) {
            return res.json({ success: false, message: "Patient ID is required" });
        }

        const times = [];
        if (req.body.morningTime && req.body.morningTime.trim() !== '') times.push(req.body.morningTime.trim());
        if (req.body.afternoonTime && req.body.afternoonTime.trim() !== '') times.push(req.body.afternoonTime.trim());
        if (req.body.nightTime && req.body.nightTime.trim() !== '') times.push(req.body.nightTime.trim());
        
        const fallbackTime = (req.body?.scheduledTime || req.body?.time || '').toString().trim();
        if (times.length === 0 && fallbackTime) times.push(fallbackTime);

        let finalTime = fallbackTime;
        if (times.length > 0) {
            finalTime = fallbackTime || times[0];
        }

        const customAudioPath = req.file ? req.file.path.replace(/\\/g, '/') : undefined;

        const med = new Medication({
            ...req.body,
            time: finalTime,
            scheduledTime: finalTime,
            customAudio: customAudioPath || req.body?.customAudio,
            userId: targetUserId,
            patientId: req.body?.patientId || targetUserId,
            medicationName: req.body?.medicationName || req.body?.name,
            scheduleStartDate: req.body?.scheduleStartDate || null,
            scheduleEndDate: req.body?.scheduleEndDate || null,
        });
        await med.save();

        if (times.length > 0) {
            for (const t of times) {
                const reminderWindow = buildReminderWindow(t, {
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
                    scheduledTime: reminderWindow?.scheduledTime || t,
                    customMessage: req.body?.customMessage,
                    customAudio: req.body?.customAudio, // note: addMedication doesn't handle upload yet!
                    overrides: {
                        confirmWindowMinutes: req.body?.confirmWindowMinutes,
                        reminderIntervalMinutes: req.body?.reminderIntervalMinutes,
                        maxReminderAttempts: req.body?.maxReminderAttempts,
                        startDate: req.body?.scheduleStartDate,
                        endDate: req.body?.scheduleEndDate,
                    },
                });
            }
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

        const customAudioPath = req.file ? req.file.path.replace(/\\/g, '/') : undefined;
        if (customAudioPath) {
            updateData.customAudio = customAudioPath;
        }

        const times = [];
        if (updateData.morningTime && updateData.morningTime.trim() !== '') times.push(updateData.morningTime.trim());
        if (updateData.afternoonTime && updateData.afternoonTime.trim() !== '') times.push(updateData.afternoonTime.trim());
        if (updateData.nightTime && updateData.nightTime.trim() !== '') times.push(updateData.nightTime.trim());
        
        const fallbackTime = (updateData.scheduledTime || updateData.time || '').toString().trim();
        if (times.length === 0 && fallbackTime) times.push(fallbackTime);

        if (times.length > 0) {
            updateData.time = fallbackTime || times[0];
            updateData.scheduledTime = times[0];
        }

        const med = await Medication.findByIdAndUpdate(req.params.id, updateData, { new: true });

        const ownerId = med?.patientId || med?.userId;
        
        if (ownerId && times.length > 0) {
            for (const t of times) {
                const reminderWindow = buildReminderWindow(t, {
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
                    scheduledTime: reminderWindow?.scheduledTime || t,
                    customMessage: updateData.customMessage,
                    customAudio: updateData.customAudio || med.customAudio,
                    overrides: {
                        confirmWindowMinutes: updateData?.confirmWindowMinutes,
                        reminderIntervalMinutes: updateData?.reminderIntervalMinutes,
                        maxReminderAttempts: updateData?.maxReminderAttempts,
                        startDate: updateData?.scheduleStartDate || med?.scheduleStartDate,
                        endDate: updateData?.scheduleEndDate || med?.scheduleEndDate,
                    },
                });
            }
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