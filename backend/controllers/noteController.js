import Note from '../model/Note.js';

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

        if (notes.length === 0) {
            return res.json({
                totalNotes: 0,
                thisWeek: 0,
                thisMonth: 0,
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

        const thisMonth = await Note.countDocuments({
            userId,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

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
            thisWeek,
            thisMonth,
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
        const note = new Note(req.body);
        await note.save();
        res.status(201).json(note);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update note
export const updateNote = async (req, res) => {
    try {
        const note = await Note.findByIdAndUpdate(
            req.params.id,
            req.body,
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