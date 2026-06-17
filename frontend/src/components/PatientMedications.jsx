import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContent } from '../context/appContext';

const readSavedSessionToken = () => {
    try {
        return window.localStorage.getItem('med_app_auth_token') || '';
    } catch {
        return '';
    }
};

const getAuthHeaders = () => {
    const token = readSavedSessionToken();
    return token ? { Authorization: `Bearer ${token}` } : undefined;
};

const PatientMedications = ({ patientId }) => {
    const { backendUrl } = useContext(AppContent);
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [tablets, setTablets] = useState(1);
    const [dosageUnit, setDosageUnit] = useState('tablets');
    const [type, setType] = useState('regular');
    
    // Inventory Linking State
    const [inventoryMeds, setInventoryMeds] = useState([]);
    const [inventoryMedicationId, setInventoryMedicationId] = useState('');
    const [isCustomMed, setIsCustomMed] = useState(false);
    
    // New Fields
    const [dateStarted, setDateStarted] = useState('');
    const [indication, setIndication] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [medications, setMedications] = useState([]);
    const [editId, setEditId] = useState(null);

    const fetchMedications = useCallback(async () => {
        try {
            const url = patientId 
                ? `${backendUrl}/api/medications?patientId=${patientId}`
                : `${backendUrl}/api/medications`;
            const { data } = await axios.get(url, { headers: getAuthHeaders() });
            if (data.success && data.meds) {
                // Filter out inventory-only medications on the frontend
                const filteredMeds = data.meds.filter(med => med.status !== 'inventory_only');
                setMedications(filteredMeds);
            }
        } catch (error) {
            console.error(error.message);
        }
    }, [backendUrl, patientId]);

    useEffect(() => {
        (async () => {
            await fetchMedications();
        })();
    }, [fetchMedications]);

    // Fetch Inventory to prevent clerical errors
    useEffect(() => {
        const fetchInventory = async () => {
            if (!patientId || !backendUrl) return;
            try {
                const { data } = await axios.get(
                    `${backendUrl}/api/medications?patientId=${patientId}&includeInventory=true`,
                    { headers: getAuthHeaders() }
                );
                if (data.success && data.meds) {
                    setInventoryMeds(data.meds.filter(m => m.status === 'inventory_only' || m.status === 'active'));
                }
            } catch (err) {
                console.error('Failed to fetch inventory:', err);
            }
        };
        fetchInventory();
    }, [patientId, backendUrl]);

    const handleInventorySelect = (e) => {
        const selectedId = e.target.value;
        if (selectedId === 'custom') {
            setIsCustomMed(true);
            setInventoryMedicationId('');
            setName('');
        } else {
            setIsCustomMed(false);
            setInventoryMedicationId(selectedId);
            const selectedMed = inventoryMeds.find(m => m._id === selectedId);
            if (selectedMed) {
                setName(selectedMed.name || selectedMed.medicationName || '');
                setDosage(selectedMed.dosage || '');
                if (selectedMed.dosageUnit) setDosageUnit(selectedMed.dosageUnit);
            }
        }
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        
        if (!name.trim() || !dosage.trim() || !dateStarted) {
            toast.error('Please fill all required fields correctly.');
            return;
        }

        if (!patientId) {
            toast.error('Patient context missing. Open this form from a patient profile.');
            return;
        }

        try {
            setLoading(true);
            const payload = { 
                name, 
                dosage, 
                tablets: Number(tablets) || 1,
                dosageUnit,
                type, 
                dateStarted, 
                indication, 
                patientId,
                inventoryMedicationId: inventoryMedicationId || null
            };

            let data;
            const requestConfig = { headers: getAuthHeaders() };
            if (editId) {
                const response = await axios.put(`${backendUrl}/api/medications/${editId}`, payload, requestConfig);
                data = response.data;
            } else {
                const response = await axios.post(backendUrl + '/api/medications', payload, requestConfig);
                data = response.data;
            }

            if (data.success) {
                toast.success(data.message || (editId ? 'Medication updated' : 'Medication added'));
                setName('');
                setDosage('');
                setTablets(1);
                setDosageUnit('tablets');
                setType('regular');
                setDateStarted('');
                setIndication('');
                setEditId(null);
                setInventoryMedicationId('');
                setIsCustomMed(false);
                fetchMedications();
            } else {
                toast.error(data.message || 'Unable to save medication.');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || 'Unable to save medication.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (med) => {
        setName(med.name);
        setDosage(med.dosage);
        setTablets(med.tablets || 1);
        setDosageUnit(med.dosageUnit || 'tablets');
        setType(med.type);
        if (med.dateStarted) {
            setDateStarted(new Date(med.dateStarted).toISOString().split('T')[0]);
        }
        setIndication(med.indication || '');
        setEditId(med._id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this medication?")) return;
        try {
            const { data } = await axios.delete(`${backendUrl}/api/medications/${id}`, { headers: getAuthHeaders() });
            if (data.success) {
                toast.success(data.message || "Medication deleted");
                fetchMedications();
                if (editId === id) {
                    setEditId(null);
                    setName('');
                    setDosage('');
                    setType('regular');
                    setDateStarted('');
                    setIndication('');
                }
            } else {
                toast.error(data.message || 'Unable to delete medication.');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || 'Unable to delete medication.');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 lg:col-span-1">
                <h3 className="text-xl font-bold text-emerald-800 mb-4">{editId ? 'Edit Medication' : 'Add Medication'}</h3>
                <form onSubmit={onSubmitHandler} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medication (From Inventory) *</label>
                        <select 
                            value={isCustomMed ? 'custom' : inventoryMedicationId} 
                            onChange={handleInventorySelect}
                            required
                            className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
                        >
                            <option value="" disabled>Select from stock...</option>
                            {inventoryMeds.map(med => (
                                <option key={med._id} value={med._id}>
                                    {med.name || med.medicationName} — Stock: {med.stockCount || 0} {med.dosageUnit || 'tablets'}
                                </option>
                            ))}
                            <option value="custom">+ Custom / Not in inventory</option>
                        </select>
                        {isCustomMed && (
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Enter medication name" />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dosage Instruction</label>
                        <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)} required className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. 500mg Twice Daily" />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Qty Per Dose *</label>
                            <input type="number" step="0.1" value={tablets} onChange={(e) => setTablets(e.target.value)} required className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. 1" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <select value={dosageUnit} onChange={(e) => setDosageUnit(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option value="tablets">Tablets</option>
                                <option value="ml">ml</option>
                                <option value="units">Units</option>
                                <option value="drops">Drops</option>
                                <option value="mg">mg</option>
                                <option value="puffs">Puffs</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            <option value="regular">Regular / Daily</option>
                            <option value="occasional">Occasional / As Needed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Started</label>
                        <input type="date" value={dateStarted} onChange={(e) => setDateStarted(e.target.value)} required className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Indication (Why take this?)</label>
                        <textarea value={indication} onChange={(e) => setIndication(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. For blood pressure" rows="2"></textarea>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md">
                            {loading ? 'Saving...' : (editId ? 'Update Medication' : 'Add Medication')}
                        </button>
                        {editId && (
                            <button type="button" onClick={() => { setEditId(null); setName(''); setDosage(''); setType('regular'); setDateStarted(''); setIndication(''); }} className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-all">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 lg:col-span-2">
                <h3 className="text-xl font-bold text-emerald-800 mb-6">Current Medications</h3>
                {medications.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="py-3 px-4 text-sm font-bold text-gray-600">Name</th>
                                    <th className="py-3 px-4 text-sm font-bold text-gray-600">Dosage</th>
                                    <th className="py-3 px-4 text-sm font-bold text-gray-600">Started</th>
                                    <th className="py-3 px-4 text-sm font-bold text-gray-600">Type</th>
                                    <th className="py-3 px-4 text-sm font-bold text-gray-600 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medications.map((med, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-emerald-50 transition-colors">
                                        <td className="py-3 px-4 font-semibold text-emerald-900">
                                            {med.name || med.medicationName}
                                            {med.indication && <div className="text-xs text-gray-400 font-normal mt-1">{med.indication}</div>}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{med.dosage}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{med.dateStarted ? new Date(med.dateStarted).toLocaleDateString() : 'N/A'}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${med.type === 'regular' ? 'bg-teal-100 text-teal-800' : 'bg-orange-100 text-orange-800'}`}>
                                                {med.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => handleEdit(med)} className="text-emerald-600 hover:text-emerald-800 transition-colors p-1">Edit</button>
                                                <button onClick={() => handleDelete(med._id)} className="text-red-500 hover:text-red-700 transition-colors p-1">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <p>No medications recorded yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientMedications;
