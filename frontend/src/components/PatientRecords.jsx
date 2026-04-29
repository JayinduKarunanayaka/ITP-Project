import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContent } from '../context/AppContext';

const PatientRecords = ({ patientId }) => {
    const { backendUrl } = useContext(AppContent);
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [editId, setEditId] = useState(null);
    const [file, setFile] = useState(null);

    const fetchRecords = async () => {
        try {
            const url = patientId 
                ? `${backendUrl}/api/records?patientId=${patientId}` 
                : `${backendUrl}/api/records`;
            const { data } = await axios.get(url, { withCredentials: true });
            if (data.success && data.records) {
                setRecords(data.records);
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        
        if (!diagnosis.trim()) {
            toast.error('Diagnosis is a required field.');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('diagnosis', diagnosis);
            if (notes) formData.append('notes', notes);
            if (patientId) formData.append('patientId', patientId);
            if (file) formData.append('file', file);

            let data;
            const config = { 
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            };

            if (editId) {
                const response = await axios.put(`${backendUrl}/api/records/${editId}`, formData, config);
                data = response.data;
            } else {
                const response = await axios.post(backendUrl + '/api/records', formData, config);
                data = response.data;
            }

            if (data.success) {
                toast.success(data.message || (editId ? 'Record updated' : 'Record added'));
                setDiagnosis('');
                setNotes('');
                setFile(null);
                setEditId(null);
                const fileInput = document.getElementById('recordFile');
                if (fileInput) fileInput.value = '';
                fetchRecords();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rec) => {
        setDiagnosis(rec.diagnosis);
        setNotes(rec.notes || '');
        setEditId(rec._id);
        setFile(null);
        const fileInput = document.getElementById('recordFile');
        if (fileInput) fileInput.value = '';
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            const { data } = await axios.delete(`${backendUrl}/api/records/${id}`, { withCredentials: true });
            if (data.success) {
                toast.success(data.message || "Record deleted");
                fetchRecords();
                if (editId === id) {
                    setEditId(null);
                    setDiagnosis('');
                    setNotes('');
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 lg:col-span-1">
                <h3 className="text-xl font-bold text-emerald-800 mb-4">{editId ? 'Edit Medical Record' : 'Add Medical Record'}</h3>
                <form onSubmit={onSubmitHandler} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis / Condition</label>
                        <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Hypertension" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes & Details (Optional)</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="4" className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Prescribed Lisinopril 10mg..."></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attach File (Optional)</label>
                        <input id="recordFile" type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md">
                            {loading ? 'Saving...' : (editId ? 'Update Record' : 'Add Record')}
                        </button>
                        {editId && (
                            <button type="button" onClick={() => { 
                                setEditId(null); setDiagnosis(''); setNotes(''); setFile(null);
                                const fileInput = document.getElementById('recordFile');
                                if (fileInput) fileInput.value = '';
                            }} className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-all">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 lg:col-span-2">
                <h3 className="text-xl font-bold text-emerald-800 mb-6">Medical History</h3>
                {records.length > 0 ? (
                    <div className="space-y-4">
                        {records.map((rec, i) => (
                            <div key={i} className="p-5 rounded-xl border-l-4 border-emerald-500 bg-gray-50 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-emerald-900 text-lg">{rec.diagnosis}</h4>
                                    <span className="text-xs text-gray-500 font-medium">{new Date(rec.createdAt).toLocaleDateString()}</span>
                                </div>
                                {rec.notes && <p className="text-sm text-gray-600 mb-3">{rec.notes}</p>}
                                {rec.fileUrl && (
                                    <div className="mb-3 p-2 bg-emerald-50 rounded-lg border border-emerald-100 inline-block">
                                        <a href={`${backendUrl}${rec.fileUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-emerald-700 hover:text-emerald-900 font-semibold transition-colors">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                            {rec.originalFileName || "Download Attached File"}
                                        </a>
                                    </div>
                                )}
                                <div className="flex gap-3 justify-end mt-2 border-t pt-3 border-gray-200">
                                    <button onClick={() => handleEdit(rec)} className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors">Edit</button>
                                    <button onClick={() => handleDelete(rec._id)} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <p>No medical records found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientRecords;
