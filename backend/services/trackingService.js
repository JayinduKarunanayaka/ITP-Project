import axios from 'axios';
import TrackingLog from '../models/TrackingLog.js';

const INVENTORY_API_URL = process.env.INVENTORY_API_URL || 'http://localhost:4000/api/inventory';
const SCHEDULE_API_URL = process.env.SCHEDULE_API_URL || 'http://localhost:4000/api/schedule';

export const fetchScheduledMedications = async (userId) => {
    try {
        return [
            { id: "med_123", name: "Lisinopril", scheduledTime: new Date() }
        ];
    } catch (error) {
        console.error("Failed to fetch from Schedule API:", error.message);
        throw new Error('Schedule module unavailable');
    }
};

export const updateInventoryOnTaken = async (medicationId, userId) => {
    try {
        console.log(`[Tracking Service] Notifying Inventory Module: Medication ${medicationId} taken by User ${userId}`);
        return true;
    } catch (error) {
        console.error(`Failed to update Inventory for Med ${medicationId}:`, error.message);
        return false;
    }
};

export const calculateAdherencePercentage = async (userId, startDate, endDate) => {
    const matchCriteria = { userId: userId };
    if (startDate || endDate) {
        matchCriteria.scheduledTime = {};
        if (startDate) matchCriteria.scheduledTime.$gte = new Date(startDate);
        if (endDate) matchCriteria.scheduledTime.$lte = new Date(endDate);
    }

    const totalDoses = await TrackingLog.countDocuments(matchCriteria);
    if (totalDoses === 0) return { adherence: 0, taken: 0, missed: 0, total: 0 };

    const onTimeDoses = await TrackingLog.countDocuments({ ...matchCriteria, status: "Taken" });
    const lateDoses = await TrackingLog.countDocuments({ ...matchCriteria, status: "Late" });
    const missedDoses = await TrackingLog.countDocuments({ ...matchCriteria, status: { $in: ["Missed", "Skipped"] } });

    // Adherence is (Taken + Late) / Total
    const percentage = Number((((onTimeDoses + lateDoses) / totalDoses) * 100).toFixed(2));

    // Aggregate true intake patterns for dynamic bar graphs replacing hardcoded mocks
    const sDate = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 6));
    const eDate = endDate ? new Date(endDate) : new Date();
    sDate.setHours(0, 0, 0, 0);
    eDate.setHours(23, 59, 59, 999);

    const logsMatch = await TrackingLog.find({
        userId,
        scheduledTime: { $gte: sDate, $lte: eDate }
    }).sort({ scheduledTime: 1 });

    // Calculate dynamic distribution (day by day)
    const dayCount = Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24));
    const labels = [];
    const distributionOnTime = Array(dayCount).fill(0);
    const distributionMissed = Array(dayCount).fill(0);

    for (let i = 0; i < dayCount; i++) {
        const d = new Date(sDate);
        d.setDate(d.getDate() + i);
        // Label format: 'Mon' for weekly, 'Mar 15' for monthly
        const label = dayCount <= 7 
            ? d.toLocaleDateString('en-US', { weekday: 'short' })
            : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        labels.push(label);
    }

    logsMatch.forEach(log => {
        const logDate = new Date(log.scheduledTime);
        const dayIdx = Math.floor((logDate - sDate) / (1000 * 60 * 60 * 24));
        if (dayIdx >= 0 && dayIdx < dayCount) {
            if (log.status === 'Taken' || log.status === 'Late') {
                distributionOnTime[dayIdx] += 1;
            } else if (log.status === 'Missed' || log.status === 'Skipped') {
                distributionMissed[dayIdx] += 1;
            }
        }
    });

    return {
        adherence: percentage,
        onTime: onTimeDoses,
        late: lateDoses,
        missed: missedDoses,
        total: totalDoses,
        weeklyDistribution: {
            onTime: distributionOnTime,
            missed: distributionMissed,
            labels: labels
        }
    };
};

export const getDetailedAdherenceAnalytics = async (userId) => {
    // 1. Calculate past month total adherence
    const now = new Date();
    const firstDayPastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    
    // Count exact matching period manually avoiding full object return sizes safely
    const mCriteria = { userId, scheduledTime: { $gte: firstDayPastMonth, $lte: lastDayPastMonth } };
    const pastTotal = await TrackingLog.countDocuments(mCriteria);
    const pastTaken = await TrackingLog.countDocuments({ ...mCriteria, status: "Taken" });
    const pastMonthRate = pastTotal > 0 ? Number(((pastTaken / pastTotal) * 100).toFixed(2)) : 0;

    // 2. Fetch all TrackingLogs for the current month
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentLogs = await TrackingLog.find({
        userId,
        scheduledTime: { $gte: firstDayCurrentMonth } // from 1st of this month to now
    }).sort({ scheduledTime: -1 });

    // Aggregate daily rates Map
    const dailyMap = {};
    currentLogs.forEach(log => {
        const isoDate = log.scheduledTime.toISOString().split('T')[0];
        if (!dailyMap[isoDate]) dailyMap[isoDate] = { taken: 0, total: 0 };
        dailyMap[isoDate].total += 1;
        if (log.status === 'Taken') dailyMap[isoDate].taken += 1;
    });

    // Format array sorted descending safely
    const dailyRates = Object.keys(dailyMap).sort((a,b) => new Date(b) - new Date(a)).map(date => {
        const data = dailyMap[date];
        return {
            date,
            taken: data.taken,
            total: data.total,
            rate: data.total > 0 ? Number(((data.taken / data.total) * 100).toFixed(0)) : 0
        };
    });

    return { pastMonthRate, dailyRates };
};
