import express from 'express';
const router = express.Router();
import Medication from '../model/Medication.js';

// Mobile device token registration
router.post('/device/register', async (req, res) => {
    try {
        const { userId, pushToken, deviceType } = req.body;
        if (!userId || !pushToken) {
            return res.status(400).json({ error: 'Missing userId or pushToken' });
        }
        console.log(`✅ Device registered: ${userId}`);
        res.status(201).json({ message: 'Device registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mobile confirmation endpoint
router.patch('/:medId/taken', async (req, res) => {
    try {
        const { medId } = req.params;
        const updated = await Medication.findByIdAndUpdate(
            medId,
            { lastTaken: new Date(), notificationSent: false },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ error: 'Medication not found' });
        }
        console.log(`✅ Medication confirmed: ${medId}`);
        res.json({ message: 'Medication confirmed', medication: updated });
    } catch (err) {
        console.error('Confirmation error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/addMedication',async(req,res)=>{
    try{
        const {patientName,patientId,medicationName,dosage,time,tablets,status}=req.body;

        // validate required fields and return a clear 400 if anything is missing
        const required = ['patientId','medicationName','time'];
        const missing = required.filter(f => {
            const v = req.body[f];
            return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
        });
        if (missing.length) {
            return res.status(400).json({
                error_type: 'ValidationError',
                message: 'Missing required fields',
                missing
            });
        }

        const newMedication=new Medication({
            patientName,
            patientId,
            medicationName,
            dosage,
            tablets: tablets || 1,
            time,
            status: status || 'active'
        });
        await newMedication.save();
        res.status(201).json({message:'Medication added successfully', medication: newMedication});
    } catch (error) {
        console.log("❌ Medication add error:", error.message);
        if (error && error.name === 'ValidationError') {
            const details = Object.keys(error.errors || {}).map(key => ({ field: key, message: error.errors[key].message }));
            return res.status(400).json({
                error_type: 'ValidationError',
                message: 'Medication validation failed',
                details
            });
        }
        const msg = (error && error.message) ? error.message : '';
        if (msg.includes('buffering timed out') || (error && (error.name === 'MongoNetworkError'))) {
            return res.status(503).json({
                error_type: 'DatabaseUnavailable',
                message: 'Database unavailable',
                exact_message: msg
            });
        }
        res.status(500).json({
            error_type: "Error",
            exact_message: error.message
        });
    }
});
router.get('/patient/:id', async (req, res) => {
    try {
        const schedules = await Medication.find({ patientId: req.params.id, status: 'active' });
        res.json(schedules);
    } catch (err) {
        console.log('❌ Get medications error:', err.message);
        const msg = (err && err.message) ? err.message : '';
        if (msg.includes('buffering timed out')) {
            return res.status(503).json({ error_type: 'DatabaseUnavailable', message: 'Database unavailable' });
        }
        res.status(500).json({ error: err.message });
    }
});

router.get('/test', (req, res) => {
    res.json({ message: "✅ Backend API is working!" });
});

export default router;
