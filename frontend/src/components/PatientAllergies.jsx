import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContent } from '../context/AppContext';

const PatientAllergies = ({ patientId }) => {
    const { backendUrl } = useContext(AppContent);
    const [hasAllergies, setHasAllergies] = useState(true);
    const [type, setType] = useState('Food');
    const [allergen, setAllergen] = useState('');
    const [severity, setSeverity] = useState('Mild');
    const [reaction, setReaction] = useState('');
    const [loading, setLoading] = useState(false);
    const [allergies, setAllergies] = useState([]);
    const [editId, setEditId] = useState(null);

    const fetchAllergies = async () => {
        try {
            const url = patientId 
                ? `${backendUrl}/api/allergies?patientId=${patientId}` 
                : `${backendUrl}/api/allergies`;
            const { data } = await axios.get(url, { withCredentials: true });
            if (data.success && data.allergies) {
                setAllergies(data.allergies);
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    useEffect(() => {
        fetchAllergies();
    }, []);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            const payload = { hasAllergies };
            if (hasAllergies) {
                payload.type = type;
                payload.allergen = allergen;
                payload.severity = severity;
                payload.reaction = reaction;
            }
            if (patientId) payload.patientId = patientId;

            let data;
            if (editId) {
                const response = await axios.put(`${backendUrl}/api/allergies/${editId}`, payload, { withCredentials: true });
                data = response.data;
            } else {
                const response = await axios.post(`${backendUrl}/api/allergies`, payload, { withCredentials: true });
                data = response.data;
            }

            if (data.success) {
                toast.success(data.message || (editId ? 'Allergy record updated' : 'Allergy record added'));
                resetForm();
                fetchAllergies();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setHasAllergies(true);
        setType('Food');
        setAllergen('');
        setSeverity('Mild');
        setReaction('');
        setEditId(null);
    };

    const handleEdit = (allergy) => {
        setHasAllergies(allergy.hasAllergies);
        if (allergy.hasAllergies) {
            setType(allergy.type || 'Food');
            setAllergen(allergy.allergen || '');
            setSeverity(allergy.severity || 'Mild');
            setReaction(allergy.reaction || '');
        } else {
            setType('Food');
            setAllergen('');
            setSeverity('Mild');
            setReaction('');
        }
        setEditId(allergy._id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this allergy record?")) return;
        try {
            const { data } = await axios.delete(`${backendUrl}/api/allergies/${id}`, { withCredentials: true });
            if (data.success) {
                toast.success(data.message || "Allergy record deleted");
                fetchAllergies();
                if (editId === id) resetForm();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getSeverityColor = (sev) => {
        switch(sev) {
            case 'Severe': return 'bg-red-100 text-red-800 border-red-200';
            case 'Moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Mild': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 lg:col-span-1">
                <h3 className="text-xl font-bold text-emerald-800 mb-4">{editId ? 'Edit Allergy' : 'Record Allergy'}</h3>
                <form onSubmit={onSubmitHandler} className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <input 
                            type="checkbox" 
                            id="hasAllergies"
                            checked={hasAllergies} 
                            onChange={(e) => setHasAllergies(e.target.checked)} 
                            className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" 
                        />
                        <label htmlFor="hasAllergies" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Patient has known allergies
                        </label>
                    </div>

                    {hasAllergies && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Allergy Type</label>
                                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                    <option value="Food">Food</option>
                                    <option value="Medication">Medication</option>
                                    <option value="Environmental">Environmental</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Allergen Name</label>
                                <input type="text" value={allergen} onChange={(e) => setAllergen(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Peanuts, Penicillin..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                                <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                    <option value="Mild">Mild</option>
                                    <option value="Moderate">Moderate</option>
                                    <option value="Severe">Severe</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reaction / Notes</label>
                                <textarea value={reaction} onChange={(e) => setReaction(e.target.value)} rows="3" className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Hives, shortness of breath..."></textarea>
                            </div>
                        </>
                    )}

                    {!hasAllergies && (
                        <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                            Saving this will explicitly record that the patient has no known allergies.
                        </p>
                    )}

                    <div className="flex gap-2 mt-4">
                        <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md">
                            {loading ? 'Saving...' : (editId ? 'Update Record' : 'Save Record')}
                        </button>
                        {editId && (
                            <button type="button" onClick={resetForm} className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-all">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 lg:col-span-2">
                <h3 className="text-xl font-bold text-emerald-800 mb-6">Allergy History</h3>
                {allergies.length > 0 ? (
                    <div className="space-y-4">
                        {allergies.map((allergy, i) => (
                            <div key={i} className={`p-4 rounded-xl border transition-all flex justify-between items-center ${allergy.hasAllergies ? 'bg-white hover:shadow-md' : 'bg-green-50 border-green-100'}`}>
                                <div>
                                    {allergy.hasAllergies ? (
                                        <>
                                            <div className="flex flex-col gap-1 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-bold text-gray-900 text-lg">{allergy.type} Allergy</h4>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getSeverityColor(allergy.severity)}`}>
                                                        {allergy.severity}
                                                    </span>
                                                </div>
                                                {allergy.allergen && <p className="text-md font-semibold text-emerald-700">Allergen: {allergy.allergen}</p>}
                                            </div>
                                            <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Reaction:</span> {allergy.reaction || "Not specified"}</p>
                                        </>
                                    ) : (
                                        <h4 className="font-bold text-emerald-700">No Known Allergies Recorded</h4>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2">Recorded on {new Date(allergy.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right flex gap-3">
                                    <button onClick={() => handleEdit(allergy)} className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors">Edit</button>
                                    <button onClick={() => handleDelete(allergy._id)} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <div className="text-gray-400 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <p className="font-medium text-gray-600">No allergy records found.</p>
                        <p className="text-sm text-gray-500 mt-1">Add a record using the form to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientAllergies;
