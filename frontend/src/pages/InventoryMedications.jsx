import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContent } from '../context/AppContext';
import PatientSidebar from '../components/PatientSidebar';
import LoggedIn from '../components/loggedin';

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

const InventoryMedications = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { backendUrl } = useContext(AppContent);
    const [patient, setPatient] = useState(null);
    const [medications, setMedications] = useState([]);

    // Modal state for updating stock/expiry
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMed, setSelectedMed] = useState(null);
    const [newStockCount, setNewStockCount] = useState('');
    const [newExpiryDate, setNewExpiryDate] = useState('');
    const [updating, setUpdating] = useState(false);

    // Modal state for adding new inventory medication
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addName, setAddName] = useState('');
    const [addDosage, setAddDosage] = useState('');
    const [addStockCount, setAddStockCount] = useState('');
    const [addExpiryDate, setAddExpiryDate] = useState('');
    const [adding, setAdding] = useState(false);

    // Fetch patient data if caretaker view
    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                const { data } = await axios.get(
                    `${backendUrl}/api/user/get-patient/${patientId}`,
                    { headers: getAuthHeaders() }
                );
                if (data.success) {
                    setPatient(data.patient);
                }
            } catch (error) {
                console.error("Network or Server Error:", error);
            }
        };
        if (patientId) {
            fetchPatientData();
        }
    }, [patientId, backendUrl]);

    const fetchMedications = async () => {
        try {
            const url = patientId
                ? `${backendUrl}/api/medications?patientId=${patientId}&includeInventory=true`
                : `${backendUrl}/api/medications?includeInventory=true`;
            const { data } = await axios.get(url, { headers: getAuthHeaders() });
            if (data.success && data.meds) {
                setMedications(data.meds);
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    useEffect(() => {
        fetchMedications();
    }, [patientId, backendUrl]);

    const openEditModal = (med) => {
        setSelectedMed(med);
        setNewStockCount(med.stockCount !== undefined ? med.stockCount : 0);
        if (med.expiryDate) {
            setNewExpiryDate(new Date(med.expiryDate).toISOString().split('T')[0]);
        } else {
            setNewExpiryDate('');
        }
        setIsModalOpen(true);
    };

    const handleUpdateInventory = async (e) => {
        e.preventDefault();
        if (!selectedMed) return;

        try {
            setUpdating(true);
            const payload = {
                stockCount: Number(newStockCount),
                expiryDate: newExpiryDate ? new Date(newExpiryDate).toISOString() : null
            };
            const response = await axios.put(`${backendUrl}/api/medications/${selectedMed._id}`, payload, { headers: getAuthHeaders() });

            if (response.data.success) {
                toast.success('Inventory details updated successfully');
                fetchMedications(); // Refresh medication list
                setIsModalOpen(false);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleAddMedication = async (e) => {
        e.preventDefault();
        try {
            setAdding(true);
            const payload = {
                name: addName,
                dosage: addDosage,
                stockCount: Number(addStockCount),
                expiryDate: addExpiryDate ? new Date(addExpiryDate).toISOString() : null,
                status: 'inventory_only',
                type: 'regular'
            };
            if (patientId) payload.patientId = patientId;

            const response = await axios.post(`${backendUrl}/api/medications`, payload, { headers: getAuthHeaders() });

            if (response.data.success) {
                toast.success('Medication added successfully');
                fetchMedications();
                setIsAddModalOpen(false);
                setAddName('');
                setAddDosage('');
                setAddStockCount('');
                setAddExpiryDate('');
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setAdding(false);
        }
    };

    const renderContent = () => (
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-emerald-900 mb-1">Medication Details</h2>
                    <p className="text-slate-500 text-sm">Review stock levels and update expiration dates for all active medications.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        Add New Medication
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Back to Inventory
                    </button>
                </div>
            </div>

            {medications.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6 text-sm font-semibold text-slate-600">Medication</th>
                                <th className="py-4 px-6 text-sm font-semibold text-slate-600">Dosage</th>
                                <th className="py-4 px-6 text-sm font-semibold text-slate-600">Stock Count</th>
                                <th className="py-4 px-6 text-sm font-semibold text-slate-600">Expiry Date</th>
                                <th className="py-4 px-6 text-sm font-semibold text-slate-600 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medications.map((med, index) => (
                                <tr key={index} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                                    <td className="py-4 px-6">
                                        <p className="font-semibold text-emerald-900">{med.name || med.medicationName || 'Unnamed'}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{med.type === 'regular' ? 'Regular' : 'As Needed'}</p>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-slate-600">{med.dosage || `${med.tablets} tablet(s) ${med.time ? `at ${med.time}` : ''}`}</td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            med.stockCount === 0 ? 'bg-blue-100 text-blue-800' :
                                            (med.stockCount > 0 && med.stockCount < 5) ? 'bg-red-100 text-red-800' :
                                            'bg-emerald-100 text-emerald-800'
                                        }`}>
                                            {med.stockCount || 0} units
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-slate-600">
                                        {med.expiryDate
                                            ? new Date(med.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                            : <span className="text-slate-400 italic">Not Set</span>}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button
                                            onClick={() => openEditModal(med)}
                                            className="text-sm font-medium text-emerald-600 hover:text-emerald-800 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-200"
                                        >
                                            Update Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">No medications found for this patient.</p>
                </div>
            )}
        </div>
    );

    // Common modal component for both views
    const renderModal = () => (
        isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 transform transition-all">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-lg font-bold text-slate-800">Update Inventory Details</h3>
                        <p className="text-sm text-slate-500 mt-1">For <span className="font-semibold text-emerald-700">{selectedMed?.name || selectedMed?.medicationName}</span></p>
                    </div>

                    <form onSubmit={handleUpdateInventory} className="p-6">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Stock Count (Units)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newStockCount}
                                    onChange={(e) => setNewStockCount(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Expiration Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={newExpiryDate}
                                        onChange={(e) => setNewExpiryDate(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors appearance-none"
                                    />
                                    {/* Small custom styling hint: native date inputs already trigger OS specific popups */}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                disabled={updating}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updating}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
                            >
                                {updating ? 'Saving...' : 'Save Details'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    );

    const renderAddModal = () => (
        isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 transform transition-all">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-lg font-bold text-slate-800">Add New Medication</h3>
                        <p className="text-sm text-slate-500 mt-1">Add medication for inventory tracking only.</p>
                    </div>

                    <form onSubmit={handleAddMedication} className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Medication Name</label>
                                <input
                                    type="text"
                                    value={addName}
                                    onChange={(e) => setAddName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Dosage</label>
                                <input
                                    type="text"
                                    value={addDosage}
                                    onChange={(e) => setAddDosage(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Stock Count (Units)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={addStockCount}
                                    onChange={(e) => setAddStockCount(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Expiration Date</label>
                                <input
                                    type="date"
                                    value={addExpiryDate}
                                    onChange={(e) => setAddExpiryDate(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors appearance-none"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                disabled={adding}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={adding}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
                            >
                                {adding ? 'Adding...' : 'Add Medication'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    );

    // Conditional rendering based on role (derived from URL presence of patientId)
    if (patientId) {
        // Caretaker View
        return (
            <div className='flex min-h-screen bg-white'>
                <PatientSidebar patientName={patient?.name} />
                <main className='flex-1 p-8 md:p-12 bg-slate-50 relative'>
                    <div className='max-w-6xl mx-auto'>
                        <h1 className='text-2xl font-bold text-emerald-900 mb-1'>
                            Inventory — <span className='text-emerald-500'>{patient?.name || 'Loading...'}</span>
                        </h1>
                        <p className='text-slate-400 text-sm mb-8'>Manage medication stock levels for this patient.</p>

                        {renderContent()}
                    </div>
                </main>
                {renderModal()}
                {renderAddModal()}
            </div>
        );
    }

    // Patient View
    return (
        <LoggedIn>
            <div className="max-w-6xl mx-auto w-full relative">
                <div className="mb-8 border-b border-emerald-100 pb-6">
                    <h1 className='text-3xl sm:text-4xl font-black text-emerald-900'>
                        Inventory
                    </h1>
                    <p className='text-emerald-700 mt-2 text-sm sm:text-base'>Manage your medication stock levels and tracking.</p>
                </div>

                {renderContent()}
            </div>
            {renderModal()}
            {renderAddModal()}
        </LoggedIn>
    );
};

export default InventoryMedications;
