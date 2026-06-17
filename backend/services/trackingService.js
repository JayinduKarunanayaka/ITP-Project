import axios from 'axios';
import TrackingLog from '../models/TrackingLog.js';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getPeriodBounds = (endDate, daysBack) => {
    const end = endDate ? new Date(endDate) : new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - daysBack + 1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

const getAdherenceRateForPeriod = async (userId, startDate, endDate) => {
    const matchCriteria = { userId, scheduledTime: { $gte: startDate, $lte: endDate } };
    const total = await TrackingLog.countDocuments(matchCriteria);
    if (total === 0) return { rate: 0, total: 0, onTime: 0, late: 0, missed: 0 };

    const onTime = await TrackingLog.countDocuments({ ...matchCriteria, status: 'Taken' });
    const late = await TrackingLog.countDocuments({ ...matchCriteria, status: 'Late' });
    const missed = await TrackingLog.countDocuments({ ...matchCriteria, status: { $in: ['Missed', 'Skipped'] } });

    return {
        rate: Number((((onTime + late) / total) * 100).toFixed(2)),
        total,
        onTime,
        late,
        missed
    };
};

const getTimeBucket = (date) => {
    const hour = new Date(date).getHours();
    if (hour < 6) return 'Overnight';
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
};

const buildBehavioralFingerprint = (logs) => {
    const misses = logs.filter((log) => ['Missed', 'Skipped'].includes(log.status));
    if (misses.length === 0) {
        return 'No repeating failure pattern detected. Your current routine looks stable.';
    }

    const dayCounts = new Map();
    const bucketCounts = new Map();

    misses.forEach((log) => {
        const dayName = DAY_LABELS[new Date(log.scheduledTime).getDay()];
        const bucket = getTimeBucket(log.scheduledTime);
        dayCounts.set(dayName, (dayCounts.get(dayName) || 0) + 1);
        bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + 1);
    });

    const [topDay] = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    const [topBucket] = [...bucketCounts.entries()].sort((a, b) => b[1] - a[1])[0] || [];

    if (topDay && topBucket) {
        return `Frequent ${topBucket.toLowerCase()} misses on ${topDay}s.`;
    }
    if (topBucket) {
        return `Frequent ${topBucket.toLowerCase()} misses detected.`;
    }
    if (topDay) {
        return `Misses cluster around ${topDay}s.`;
    }
    return 'Irregular misses detected without a clear pattern.';
};

const buildRiskHotspots = (logs) => {
    const buckets = [
        { label: 'Overnight', start: 0, end: 6, total: 0, missed: 0 },
        { label: 'Morning', start: 6, end: 12, total: 0, missed: 0 },
        { label: 'Afternoon', start: 12, end: 18, total: 0, missed: 0 },
        { label: 'Evening', start: 18, end: 24, total: 0, missed: 0 },
    ];

    logs.forEach((log) => {
        const hour = new Date(log.scheduledTime).getHours();
        const bucket = buckets.find((entry) => hour >= entry.start && hour < entry.end);
        if (!bucket) return;
        bucket.total += 1;
        if (['Missed', 'Skipped'].includes(log.status)) {
            bucket.missed += 1;
        }
    });

    return buckets.map((bucket) => ({
        label: bucket.label,
        total: bucket.total,
        missed: bucket.missed,
        failureRate: bucket.total > 0 ? Number(((bucket.missed / bucket.total) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.failureRate - a.failureRate);
};

const buildClinicalAdvice = (fingerprint, hotspots) => {
    const advice = [];
    const topHotspot = hotspots[0];

    if (fingerprint.toLowerCase().includes('morning')) {
        advice.push('Move the reminder 15 to 30 minutes earlier and pair it with a morning routine trigger.');
    }
    if (fingerprint.toLowerCase().includes('weekend')) {
        advice.push('Keep weekends consistent by setting an alarm and a backup notification for off-days.');
    }
    if (topHotspot?.failureRate >= 40) {
        advice.push(`The ${topHotspot.label.toLowerCase()} window is your highest risk period. Add a second reminder there.`);
    }
    if (advice.length === 0) {
        advice.push('Your adherence pattern is steady. Keep the current reminder cadence and review monthly.');
    }

    return advice;
};

const buildCriticalMedication = (logs) => {
    const counts = new Map();
    logs.forEach((log) => {
        if (!['Missed', 'Skipped'].includes(log.status)) return;
        const key = log.medicationName || 'Unknown Medication';
        counts.set(key, (counts.get(key) || 0) + 1);
    });

    const [medicationName, missedCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    if (!medicationName) {
        return { medicationName: null, missedCount: 0 };
    }

    return { medicationName, missedCount };
};

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
        const { default: Medication } = await import('../model/Medication.js');
        const scheduleMed = await Medication.findById(medicationId);
        if (!scheduleMed) {
            console.warn(`[Inventory] Medication ${medicationId} not found — skipping stock update.`);
            return false;
        }

        // If this schedule medication is linked to an inventory item, decrement that instead
        const inventoryId = scheduleMed.inventoryMedicationId;
        const targetMed = inventoryId ? await Medication.findById(inventoryId) : scheduleMed;

        if (!targetMed) {
            console.warn(`[Inventory] Linked inventory medication ${inventoryId} not found — skipping stock update.`);
            return false;
        }

        const doseQty = Number(scheduleMed.tablets) || 1;
        const currentStock = Number(targetMed.stockCount) || 0;

        if (currentStock <= 0) {
            console.warn(`[Inventory] ${targetMed.medicationName || targetMed.name} has no stock left (${currentStock} ${targetMed.dosageUnit || 'tablets'}).`);
            return false;
        }

        const newStock = Math.max(0, currentStock - doseQty);
        targetMed.stockCount = newStock;
        await targetMed.save();

        const label = targetMed.medicationName || targetMed.name;
        const unit = targetMed.dosageUnit || 'tablets';
        console.log(`[Inventory] ${label}: ${currentStock} → ${newStock} ${unit} (took ${doseQty})`);

        if (newStock > 0 && newStock <= 5) {
            console.warn(`[Inventory] ⚠️ LOW STOCK: ${label} has only ${newStock} ${unit} remaining.`);
        }

        return true;
    } catch (error) {
        console.error(`[Inventory] Failed to update stock for Med ${medicationId}:`, error.message);
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

    const currentWeekBounds = getPeriodBounds(now, 7);
    const previousWeekEnd = new Date(currentWeekBounds.start);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
    const previousWeekBounds = getPeriodBounds(previousWeekEnd, 7);

    const currentWeekRate = await getAdherenceRateForPeriod(userId, currentWeekBounds.start, currentWeekBounds.end);
    const previousWeekRate = await getAdherenceRateForPeriod(userId, previousWeekBounds.start, previousWeekBounds.end);
    const trendDelta = Number((currentWeekRate.rate - previousWeekRate.rate).toFixed(2));

    const rollingLogs = await TrackingLog.find({
        userId,
        scheduledTime: { $gte: previousWeekBounds.start, $lte: currentWeekBounds.end }
    }).sort({ scheduledTime: -1 });

    const behavioralFingerprint = buildBehavioralFingerprint(rollingLogs);
    const riskHotspots = buildRiskHotspots(rollingLogs);
    const clinicalAdvice = buildClinicalAdvice(behavioralFingerprint, riskHotspots);
    const criticalMedication = buildCriticalMedication(rollingLogs);

    return {
        pastMonthRate,
        dailyRates,
        trendVelocity: {
            currentRate: currentWeekRate.rate,
            previousRate: previousWeekRate.rate,
            delta: trendDelta,
            label: trendDelta >= 0 ? 'Improved' : 'Declined',
        },
        behavioralFingerprint,
        riskHotspots,
        clinicalAdvice,
        criticalMedication,
    };
};

export const analyzeAdherenceRisk = async (userId) => {
    // Look at the last 14 days of data for a meaningful risk assessment
    const now = new Date();
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);

    const logs = await TrackingLog.find({
        userId,
        scheduledTime: { $gte: fourteenDaysAgo, $lte: now }
    }).sort({ scheduledTime: -1 });

    if (logs.length === 0) {
        return {
            riskLevel: 'Unknown',
            score: 100,
            consecutiveMisses: 0,
            recommendation: 'Start tracking your medications to see your health risk analysis.',
            color: '#9e9e9e' // Grey
        };
    }

    let takenCount = 0;
    let consecutiveMisses = 0;
    let currentMissStreak = 0;
    let reachedActiveStreak = false;

    logs.forEach(log => {
        if (log.status === 'Taken' || log.status === 'Late') {
            takenCount++;
            reachedActiveStreak = true;
        } else if (log.status === 'Missed' || log.status === 'Skipped') {
            if (!reachedActiveStreak) {
                currentMissStreak++;
            }
        }
    });

    const adherenceRate = (takenCount / logs.length) * 100;
    
    let riskLevel = 'Low';
    let recommendation = 'Your adherence is excellent. Keep it up!';
    let color = '#4caf50'; // Green

    if (currentMissStreak >= 3 || adherenceRate < 60) {
        riskLevel = 'High';
        recommendation = 'Critical: You have missed multiple doses. Please consult your doctor and set stricter reminders.';
        color = '#f44336'; // Red
    } else if (currentMissStreak >= 1 || adherenceRate < 85) {
        riskLevel = 'Moderate';
        recommendation = 'Warning: Your adherence has slipped recently. Try to stay consistent to ensure medication effectiveness.';
        color = '#ff9800'; // Orange
    }

    return {
        riskLevel,
        score: Math.round(adherenceRate),
        consecutiveMisses: currentMissStreak,
        recommendation,
        color
    };
};
