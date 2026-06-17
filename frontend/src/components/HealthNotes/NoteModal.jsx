import { useState, useEffect } from 'react';

const NoteModal = ({ isOpen, onClose, onSubmit, note }) => {
    const getInitialFormState = (sourceNote = null) => ({
        title: sourceNote?.title || '',
        category: sourceNote?.category || 'General',
        date: sourceNote?.date ? new Date(sourceNote.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: sourceNote?.time || new Date().toTimeString().slice(0, 5),
        mood: sourceNote?.mood || 'Neutral',
        physicalCondition: sourceNote?.physicalCondition || 'Good',
        severity: sourceNote?.severity || 'Mild',
        symptomName: sourceNote?.symptomName || '',
        doctor: sourceNote?.doctor || '',
        location: sourceNote?.location || '',
        notes: sourceNote?.notes || '',
    });

    //form state
    const [formData, setFormData] = useState(getInitialFormState());

    // populate form when editing existing note
    useEffect(() => {
        setFormData(getInitialFormState(note));
    }, [note]);

    const category = formData.category;
    const showSeverity = category === 'Symptom';
    const showPhysicalCondition = category !== 'Appointment';
    const showAppointmentFields = category === 'Appointment';
    const showSymptomName = category === 'Symptom';

    const handleCategoryChange = (value) => {
        setFormData((current) => ({
            ...current,
            category: value,
            severity: value === 'Symptom' ? current.severity || 'Mild' : '',
            physicalCondition: value === 'Appointment' ? '' : current.physicalCondition || 'Good',
            symptomName: value === 'Symptom' ? current.symptomName : '',
            doctor: value === 'Appointment' ? current.doctor : '',
            location: value === 'Appointment' ? current.location : '',
        }));
    };

    const buildSubmissionPayload = () => {
        const basePayload = {
            title: formData.title,
            category: formData.category,
            date: formData.date,
            time: formData.time,
            mood: formData.mood,
            notes: formData.notes,
        };

        if (showPhysicalCondition) {
            basePayload.physicalCondition = formData.physicalCondition;
        }

        if (showSeverity) {
            basePayload.severity = formData.severity;
            basePayload.symptomName = formData.symptomName || formData.title;
        }

        if (showAppointmentFields) {
            basePayload.doctor = formData.doctor;
            basePayload.location = formData.location;
        }

        return basePayload;
    };

    //form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(buildSubmissionPayload());
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
                                    onChange={(e) => handleCategoryChange(e.target.value)}
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

                        {/* Time */}
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
                        </div>

                        {showAppointmentFields && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Doctor *</label>
                                    <input
                                        type="text"
                                        required={showAppointmentFields}
                                        value={formData.doctor}
                                        onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g., Dr. Smith"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                                    <input
                                        type="text"
                                        required={showAppointmentFields}
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g., City Hospital"
                                    />
                                </div>
                            </div>
                        )}

                        {showSymptomName && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Symptom Name *</label>
                                <input
                                    type="text"
                                    required={showSymptomName}
                                    value={formData.symptomName}
                                    onChange={(e) => setFormData({ ...formData, symptomName: e.target.value, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g., Headache, Nausea"
                                />
                            </div>
                        )}

                        {showPhysicalCondition && (
                            <div className={showSeverity ? 'grid grid-cols-2 gap-4' : ''}>
                                <div className={showSeverity ? '' : 'w-full'}>
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

                                {showSeverity && (
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
                                )}
                            </div>
                        )}

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