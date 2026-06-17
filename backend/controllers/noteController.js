import Note from '../model/Note.js';

const CATEGORY_FIELD_RULES = {
    Medication: {
        keep: ['title', 'category', 'date', 'time', 'mood', 'physicalCondition', 'notes', 'userId'],
    },
    Appointment: {
        keep: ['title', 'category', 'date', 'time', 'mood', 'doctor', 'location', 'notes', 'userId'],
    },
    Symptom: {
        keep: ['title', 'category', 'date', 'time', 'mood', 'physicalCondition', 'severity', 'symptomName', 'notes', 'userId'],
    },
    'Vital Signs': {
        keep: ['title', 'category', 'date', 'time', 'mood', 'physicalCondition', 'notes', 'userId'],
    },
    General: {
        keep: ['title', 'category', 'date', 'time', 'mood', 'physicalCondition', 'notes', 'userId'],
    },
};

const sanitizeNotePayload = (payload) => {
    const category = payload.category || 'General';
    const rules = CATEGORY_FIELD_RULES[category] || CATEGORY_FIELD_RULES.General;
    const sanitized = {};

    rules.keep.forEach((key) => {
        if (payload[key] !== undefined) {
            sanitized[key] = payload[key];
        }
    });

    sanitized.category = category;

    if (!sanitized.physicalCondition) {
        sanitized.physicalCondition = 'Good';
    }

    if (!sanitized.mood) {
        sanitized.mood = 'Neutral';
    }

    if (!sanitized.severity && category === 'Symptom') {
        sanitized.severity = 'Mild';
    }

    return sanitized;
};

const OPTIONAL_NOTE_FIELDS = ['severity', 'physicalCondition', 'symptomName', 'doctor', 'location'];

// Get all notes
export const getNotes = async (req, res) => {
    try {
        const { userId, category, search } = req.query;
        let query = { userId };

        if (category && category !== 'All Categories') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }

        const notes = await Note.find(query).sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get trends
export const getTrends = async (req, res) => {
    try {
        const { userId } = req.query;
        const notes = await Note.find({ userId });
        const recentNotes = notes.filter((note) => {
            const noteDate = new Date(note.createdAt);
            const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return noteDate >= monthAgo;
        });

        if (notes.length === 0) {
            return res.json({
                totalNotes: 0,
                today: 0,
                thisWeek: 0,
                thisMonth: 0,
                categoryBreakdown: [],
                severityDistribution: {
                    Mild: { count: 0, percentage: 0 },
                    Moderate: { count: 0, percentage: 0 },
                    Severe: { count: 0, percentage: 0 },
                    Critical: { count: 0, percentage: 0 }
                },
                topSymptoms: []
            });
        }

        const totalNotes = notes.length;

        const thisWeek = await Note.countDocuments({
            userId,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);
        const today = await Note.countDocuments({
            userId,
            $or: [
                { date: { $gte: todayStart, $lt: todayEnd } },
                { createdAt: { $gte: todayStart, $lt: todayEnd } },
                { updatedAt: { $gte: todayStart, $lt: todayEnd } }
            ]
        });

        const thisMonth = await Note.countDocuments({
            userId,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        const categoryOrder = ['Symptom', 'Medication', 'Appointment', 'Vital Signs', 'General'];
        const categoryCounts = categoryOrder.reduce((acc, category) => {
            acc[category] = 0;
            return acc;
        }, {});

        recentNotes.forEach((note) => {
            const category = categoryCounts.hasOwnProperty(note.category) ? note.category : 'General';
            categoryCounts[category] += 1;
        });

        const categoryBreakdown = categoryOrder
            .map((category) => ({
                category,
                count: categoryCounts[category],
                percentage: recentNotes.length > 0 ? ((categoryCounts[category] / recentNotes.length) * 100).toFixed(1) : 0,
            }))
            .filter((item) => item.count > 0);

        const severityCounts = { Mild: 0, Moderate: 0, Severe: 0, Critical: 0 };
        notes.forEach(note => {
            if (severityCounts.hasOwnProperty(note.severity)) {
                severityCounts[note.severity]++;
            }
        });

        const severityDistribution = {};
        for (const [severity, count] of Object.entries(severityCounts)) {
            severityDistribution[severity] = {
                count,
                percentage: totalNotes > 0 ? ((count / totalNotes) * 100).toFixed(1) : 0
            };
        }

        const symptomNotes = notes.filter(note => note.category === 'Symptom');
        const symptomCounts = {};
        symptomNotes.forEach(note => {
            symptomCounts[note.title] = (symptomCounts[note.title] || 0) + 1;
        });

        const topSymptoms = Object.entries(symptomCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({
            totalNotes,
            today,
            thisWeek,
            thisMonth,
            categoryBreakdown,
            severityDistribution,
            topSymptoms
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create note
export const createNote = async (req, res) => {
    try {
        const note = new Note(sanitizeNotePayload(req.body));
        await note.save();
        res.status(201).json(note);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update note
export const updateNote = async (req, res) => {
    try {
        const updatePayload = sanitizeNotePayload(req.body);
        const unsetPayload = {};

        OPTIONAL_NOTE_FIELDS.forEach((field) => {
            if (!(field in updatePayload)) {
                unsetPayload[field] = '';
            }
        });

        const updateQuery = { $set: updatePayload };
        if (Object.keys(unsetPayload).length > 0) {
            updateQuery.$unset = unsetPayload;
        }

        const note = await Note.findByIdAndUpdate(
            req.params.id,
            updateQuery,
            { new: true, runValidators: true }
        );
        if (!note) return res.status(404).json({ message: 'Note not found' });
        res.json(note);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete note
export const deleteNote = async (req, res) => {
    try {
        const note = await Note.findByIdAndDelete(req.params.id);
        if (!note) return res.status(404).json({ message: 'Note not found' });
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};