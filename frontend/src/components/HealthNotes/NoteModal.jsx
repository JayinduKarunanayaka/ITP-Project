import { useState, useEffect } from 'react';

const NoteModal = ({ isOpen, onClose, onSubmit, note }) => {
    //form state
    const [formData, setFormData] = useState({
        title: '',
        category: 'General',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        mood: 'Neutral',
        physicalCondition: 'Good',
        severity: 'Mild',
        notes: '',
    });

    // populate form when editing existing note
    useEffect(() => {
        if (note) {
            setFormData({
                title: note.title,
                category: note.category,
                date: new Date(note.date).toISOString().split('T')[0],
                time: note.time,
                mood: note.mood,
                physicalCondition: note.physicalCondition,
                severity: note.severity || 'Mild',
                notes: note.notes,
            });
        }
    }, [note]);

    //form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    //CONDITIONAL RENDER: Don't render modal if not open
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* //modal header = title , close button */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{note ? 'Edit Health Note' : 'Add Health Note'}</h2>
                            <p className="text-gray-600 text-sm mt-1">
                                {note ? 'Update your health note details' : 'Add a new health note with detailed information.'}
                            </p>
                        </div>
                        {/* close button - X icon */}
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                     {/* FORM: Input fields for note data */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="e.g., Morning headache, Annual checkup"
                            />
                        </div>

                        {/* Category & Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option>General</option>
                                    <option>Symptom</option>
                                    <option>Appointment</option>
                                    <option>Medication</option>
                                    <option>Vital Signs</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Time & Mood */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mood</label>
                                <select
                                    value={formData.mood}
                                    onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option>Great</option>
                                    <option>Good</option>
                                    <option>Neutral</option>
                                    <option>Poor</option>
                                    <option>Terrible</option>
                                </select>
                            </div>
                        </div>

                        {/* Physical Condition */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Physical Condition</label>
                            <select
                                value={formData.physicalCondition}
                                onChange={(e) => setFormData({ ...formData, physicalCondition: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                            >
                                <option>Excellent</option>
                                <option>Good</option>
                                <option>Fair</option>
                                <option>Poor</option>
                                <option>Very Poor</option>
                            </select>
                        </div>

                        {/* Severity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Severity Level</label>
                            <select
                                value={formData.severity}
                                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="Mild">Mild</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Severe">Severe</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>

                        {/* Additional Notes-text area*/}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes *</label>
                            <textarea
                                required
                                rows="4"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none"
                                placeholder="Add detailed notes here..."
                            />
                        </div>

                        {/* Action Buttons: Cancel & Submit */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-md"
                            >
                                {note ? 'Update Note' : 'Add Note'}  {/* dynamic button text */}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NoteModal;