import TrackingLog from '../models/TrackingLog.js';
import userModel from '../model/userModel.js';
import { calculateAdherencePercentage, updateInventoryOnTaken, getDetailedAdherenceAnalytics, analyzeAdherenceRisk } from '../services/trackingService.js';
import { generateAdherencePDF } from '../services/reportService.js';
import Medication from '../model/Medication.js';
import { ensureNextDailyTrackingSchedule } from '../services/reminderLifecycleService.js';

const TIME_ONLY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const parseScheduledTimeValue = (value) => {
    if (!value) return null;

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        const timeMatch = trimmed.match(TIME_ONLY_PATTERN);
        if (timeMatch) {
            const now = new Date();
            now.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
            return now;
        }
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const recordIntake = async (req, res) => {
    try {
        const { medicationId, medicationName, scheduledTime, takenTime, status, note, patientId, trackingLogId } = req.body;
        // The userAuth middleware attaches userId into req.body
        const authenticatedUserId = req.body.userId;

        // Determine if we're acting for a patient (caretaker role) or for the logged-in user themselves
        const targetUserId = patientId || authenticatedUserId;

        if (patientId && patientId.toString() !== authenticatedUserId.toString()) {
            // Verify caretaker relationship
            const patient = await userModel.findById(patientId);
            if (!patient || (patient.caretakerId && patient.caretakerId.toString() !== authenticatedUserId.toString())) {
                return res.status(403).json({ success: false, message: 'Unauthorized: You are not the assigned caretaker for this patient.' });
            }
            if (!patient.caretakerId) {
                return res.status(403).json({ success: false, message: 'Unauthorized: This patient does not have an assigned caretaker.' });
            }
        }

        if (!medicationId || !scheduledTime || !status || !targetUserId) {
            return res.status(400).json({ success: false, message: 'Missing required Intake payload elements.' });
        }

        let logEntry = null;
        const intakeStatus = status === 'Taken' ? 'Taken' : status === 'Late' ? 'Late' : status === 'Missed' ? 'Missed' : 'Skipped';
        const now = takenTime ? new Date(takenTime) : new Date();

        if (trackingLogId) {
            logEntry = await TrackingLog.findOne({ _id: trackingLogId, userId: targetUserId });
        }

        let parsedScheduledTime = null;
        if (!logEntry) {
            parsedScheduledTime = parseScheduledTimeValue(scheduledTime);
            if (!parsedScheduledTime) {
                return res.status(400).json({ success: false, message: 'Invalid scheduledTime. Use ISO datetime or HH:MM.' });
            }

            const query = {
                userId: targetUserId,
                medicationId,
                scheduledTime: parsedScheduledTime,
            };
            logEntry = await TrackingLog.findOne(query);
        }

        if (logEntry) {
            logEntry.status = intakeStatus;
            logEntry.takenTime = (intakeStatus === 'Taken' || intakeStatus === 'Late') ? now : logEntry.takenTime;
            logEntry.note = note || logEntry.note || '';
            logEntry.retryState = intakeStatus === 'Taken' || intakeStatus === 'Late' ? 'completed' : logEntry.retryState;
            logEntry.nextReminderAt = null;
            logEntry.missedNotifiedAt = intakeStatus === 'Missed' ? now : logEntry.missedNotifiedAt;
            await logEntry.save();
        } else {
            const fallback = new TrackingLog({
                userId: targetUserId,
                medicationId,
                medicationName: medicationName || 'Unknown Medication',
                scheduledTime: parsedScheduledTime || new Date(),
                takenTime: (intakeStatus === 'Taken' || intakeStatus === 'Late') ? now : null,
                status: intakeStatus,
                note: note || '',
                retryState: intakeStatus === 'Taken' || intakeStatus === 'Late' ? 'completed' : 'none',
                nextReminderAt: null,
                missedNotifiedAt: intakeStatus === 'Missed' ? now : null,
            });
            await fallback.save();
            logEntry = fallback;
        }

        if (intakeStatus === 'Taken' || intakeStatus === 'Late') {
            await updateInventoryOnTaken(medicationId, targetUserId);
        }

        // Create the next day's reminder within schedule range (if configured).
        try {
            const med = await Medication.findById(medicationId).lean();
            if (med?.time && med?.status === 'active') {
                await ensureNextDailyTrackingSchedule({
                    userId: targetUserId,
                    medicationId,
                    medicationName: med.medicationName || med.name || medicationName || 'Medication',
                    time: med.time,
                    startDate: med.scheduleStartDate,
                    endDate: med.scheduleEndDate,
                    after: logEntry?.scheduledTime || new Date(),
                });
            }
        } catch {
            // Don't block intake recording if next-schedule creation fails.
        }

        res.status(201).json({ success: true, data: logEntry });
    } catch (error) {
        console.error("Tracking record error:", error);
        res.status(500).json({ success: false, message: 'Server Error during record creation.', error: error.message });
    }
};

export const getAdherence = async (req, res) => {
    try {
        const { userId } = req.params;
        const authenticatedUserId = req.body.userId;

        // Security check
        if (userId.toString() !== authenticatedUserId.toString()) {
            const patient = await userModel.findById(userId);
            if (!patient || (patient.caretakerId && patient.caretakerId.toString() !== authenticatedUserId.toString()) || !patient.caretakerId) {
                return res.status(403).json({ success: false, message: 'Unauthorized access to patient data.' });
            }
        }

        const { type, startDate, endDate } = req.query;

        let sDate = startDate ? new Date(startDate) : null;
        let eDate = endDate ? new Date(endDate) : null;

        if (type === 'daily') {
            sDate = new Date(); sDate.setHours(0, 0, 0, 0);
            eDate = new Date(); eDate.setHours(23, 59, 59, 999);
        } else if (type === 'weekly') {
            sDate = new Date(); sDate.setDate(sDate.getDate() - 7);
            eDate = new Date();
        } else if (type === 'monthly') {
            sDate = new Date(); sDate.setMonth(sDate.getMonth() - 1);
            eDate = new Date();
        }

        const adherenceData = await calculateAdherencePercentage(userId, sDate, eDate);

        res.status(200).json({ success: true, ...adherenceData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Calculated Adherence error', error: error.message });
    }
};

export const getHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const authenticatedUserId = req.body.userId;

        // Security check
        if (userId.toString() !== authenticatedUserId.toString()) {
            const patient = await userModel.findById(userId);
            if (!patient || (patient.caretakerId && patient.caretakerId.toString() !== authenticatedUserId.toString()) || !patient.caretakerId) {
                return res.status(403).json({ success: false, message: 'Unauthorized access to patient history.' });
            }
        }

        const { startDate, endDate } = req.query;

        const matchCriteria = { userId };
        
        if (startDate || endDate) {
            matchCriteria.scheduledTime = {};
            if (startDate) matchCriteria.scheduledTime.$gte = new Date(startDate);
            if (endDate) matchCriteria.scheduledTime.$lte = new Date(endDate);
        }

        const logs = await TrackingLog.find(matchCriteria)
                                      .sort({ scheduledTime: -1 })
                                      .limit(100);

        res.status(200).json({ success: true, count: logs.length, data: logs });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server History Log Error.', error: error.message });
    }
};

export const generateReport = async (req, res) => {
    try {
        const { userId } = req.params;
        const authenticatedUserId = req.body.userId;

        // Security check
        if (userId !== authenticatedUserId) {
            const patient = await userModel.findById(userId);
            if (!patient || patient.caretakerId?.toString() !== authenticatedUserId.toString()) {
                return res.status(403).json({ success: false, message: 'Unauthorized access to patient reports.' });
            }
        }

        const { startDate, endDate } = req.query;

        await generateAdherencePDF(userId, res, startDate, endDate);
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Report Controller Generator Error.', error: error.message });
    }
};

export const getDetailedAdherence = async (req, res) => {
    try {
        const { userId } = req.params;
        const authenticatedUserId = req.body.userId;

        // Security check
        if (userId !== authenticatedUserId) {
            const patient = await userModel.findById(userId);
            if (!patient || patient.caretakerId?.toString() !== authenticatedUserId.toString()) {
                return res.status(403).json({ success: false, message: 'Unauthorized access to patient analytics.' });
            }
        }

        const details = await getDetailedAdherenceAnalytics(userId);
        const risk = await analyzeAdherenceRisk(userId);
        res.status(200).json({ success: true, ...details, riskAnalysis: risk });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Detailed Adherence Fetch Error', error: error.message });
    }
};

export const updateLog = async (req, res) => {
    try {
        const { logId } = req.params;
        const { medicationId, medicationName, scheduledTime, takenTime, status, note } = req.body;
        const authenticatedUserId = req.body.userId;

        const log = await TrackingLog.findById(logId);
        if (!log) {
            return res.status(404).json({ success: false, message: 'Log entry not found.' });
        }

        // Security check: requester must be log owner OR owner's caretaker
        if (log.userId.toString() !== authenticatedUserId.toString()) {
            const patient = await userModel.findById(log.userId);
            if (!patient || (patient.caretakerId && patient.caretakerId.toString() !== authenticatedUserId.toString()) || !patient.caretakerId) {
                return res.status(403).json({ success: false, message: 'Unauthorized: You cannot edit this log.' });
            }
        }

        // Update fields
        if (medicationId) log.medicationId = medicationId;
        if (medicationName) log.medicationName = medicationName;
        if (scheduledTime) log.scheduledTime = scheduledTime;
        if (takenTime) log.takenTime = takenTime;
        if (status) log.status = status;
        if (note !== undefined) log.note = note;

        await log.save();

        res.status(200).json({ success: true, message: 'Log updated successfully', data: log });
    } catch (error) {
        console.error("Update Log Error:", error);
        res.status(500).json({ success: false, message: 'Server error during log update.', error: error.message });
    }
};

export const deleteLog = async (req, res) => {
    try {
        const { logId } = req.params;
        const authenticatedUserId = req.body.userId;

        const log = await TrackingLog.findById(logId);
        if (!log) {
            return res.status(404).json({ success: false, message: 'Log entry not found.' });
        }

        // Security check: same as update
        if (log.userId.toString() !== authenticatedUserId.toString()) {
            const patient = await userModel.findById(log.userId);
            if (!patient || (patient.caretakerId && patient.caretakerId.toString() !== authenticatedUserId.toString()) || !patient.caretakerId) {
                return res.status(403).json({ success: false, message: 'Unauthorized: You cannot delete this log.' });
            }
        }

        await TrackingLog.findByIdAndDelete(logId);
        res.status(200).json({ success: true, message: 'Log deleted successfully' });
    } catch (error) {
        console.error("Delete Log Error:", error);
        res.status(500).json({ success: false, message: 'Server error during log deletion.', error: error.message });
    }
};

export const getRiskAnalysis = async (req, res) => {
    try {
        const { userId } = req.params;
        const authenticatedUserId = req.body.userId;

        // Security check
        if (userId !== authenticatedUserId) {
            const patient = await userModel.findById(userId);
            if (!patient || patient.caretakerId?.toString() !== authenticatedUserId.toString()) {
                return res.status(403).json({ success: false, message: 'Unauthorized access to risk analysis.' });
            }
        }

        const risk = await analyzeAdherenceRisk(userId);
        res.status(200).json({ success: true, data: risk });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Risk Analysis Fetch Error', error: error.message });
    }
};
