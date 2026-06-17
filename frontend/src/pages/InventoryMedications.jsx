import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContent } from '../context/appContext';
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

    const allowsDecimal = (unit) => ['ml', 'mg'].includes(unit);

    const [patient, setPatient] = useState(null);
    const [medications, setMedications] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [categories, setCategories] = useState(['All']);

    const filteredMeds = selectedCategory === 'All'
        ? medications
        : medications.filter(m => (m.category || 'General') === selectedCategory);

    const filteredPrescs = selectedCategory === 'All'
        ? prescriptions
        : prescriptions.filter(p => (p.category || 'General') === selectedCategory);

    // Modal state for updating stock/expiry
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMed, setSelectedMed] = useState(null);
    const [newStockCount, setNewStockCount] = useState('');
    const [newExpiryDate, setNewExpiryDate] = useState('');
    const [newDosageUnit, setNewDosageUnit] = useState('tablets');
    const [updating, setUpdating] = useState(false);

    // Modal state for adding new inventory medication
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addName, setAddName] = useState('');
    const [addStockCount, setAddStockCount] = useState('');
    const [addExpiryDate, setAddExpiryDate] = useState('');
    const [addDosageUnit, setAddDosageUnit] = useState('tablets');
    const [addCategory, setAddCategory] = useState('');
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

    const fetchPrescriptions = async () => {
        try {
            const url = patientId
                ? `${backendUrl}/api/prescriptions?patientId=${patientId}`
                : `${backendUrl}/api/prescriptions`;
            const { data } = await axios.get(url, { headers: getAuthHeaders() });
            if (data.success && data.prescriptions) {
                setPrescriptions(data.prescriptions);
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    useEffect(() => {
        fetchMedications();
        fetchPrescriptions();
    }, [patientId, backendUrl]);

    useEffect(() => {
        const medCats = medications.map(m => m.category || 'General');
        const prescCats = prescriptions.map(p => p.category || 'General');
        const allCats = Array.from(new Set(['All', ...medCats, ...prescCats]));
        setCategories(allCats);
    }, [medications, prescriptions]);

    const openEditModal = (med) => {
        setSelectedMed(med);
        setNewStockCount(med.stockCount !== undefined ? med.stockCount : 0);
        if (med.expiryDate) {
            setNewExpiryDate(new Date(med.expiryDate).toISOString().split('T')[0]);
        } else {
            setNewExpiryDate('');
        }
        setNewDosageUnit(med.dosageUnit || 'tablets');
        setIsModalOpen(true);
    };

    const handleUpdateInventory = async (e) => {
        e.preventDefault();
        if (!selectedMed) return;

        try {
            if (!allowsDecimal(newDosageUnit) && !Number.isInteger(Number(newStockCount))) {
                toast.error(`Stock count must be a whole number for ${newDosageUnit}`);
                return;
            }
            setUpdating(true);
            const payload = {
                stockCount: Number(newStockCount),
                expiryDate: newExpiryDate ? new Date(newExpiryDate).toISOString() : null,
                dosageUnit: newDosageUnit
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

    const handleDeleteMedication = async (id) => {
        if (!window.confirm("Are you sure you want to delete this medication? All associated history will be removed.")) return;
        try {
            const { data } = await axios.delete(`${backendUrl}/api/medications/${id}`, { headers: getAuthHeaders() });
            if (data.success) {
                toast.success("Medication removed from inventory");
                fetchMedications();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleAddMedication = async (e) => {
        e.preventDefault();
        try {
            if (!allowsDecimal(addDosageUnit) && !Number.isInteger(Number(addStockCount))) {
                toast.error(`Stock count must be a whole number for ${addDosageUnit}`);
                return;
            }
            setAdding(true);
            const payload = {
                name: addName,
                stockCount: Number(addStockCount),
                expiryDate: addExpiryDate ? new Date(addExpiryDate).toISOString() : null,
                dosageUnit: addDosageUnit,
                category: addCategory || 'General',
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
                setAddStockCount('');
                setAddExpiryDate('');
                setAddExpiryDate('');
                setAddDosageUnit('tablets');
                setAddCategory('');
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
                <div className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex flex-col gap-1 w-full md:w-48">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">Filter Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
                        >
                            + Add New
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Medications</h3>
                {filteredMeds.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="py-4 px-6 text-sm font-semibold text-slate-600">Medication</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-slate-600">Category</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-slate-600">Stock Count</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-slate-600">Expiry Date</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-slate-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMeds.map((med, index) => (
                                    <tr key={index} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                                        <td className="py-4 px-6">
                                            <p className="font-semibold text-emerald-900">{med.name || med.medicationName || 'Unnamed'}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{med.type === 'regular' ? 'Regular' : 'As Needed'}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                                {med.category || 'General'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${med.stockCount <= 5 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                                {med.stockCount || 0} {med.dosageUnit || 'tablets'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-600">
                                            {med.expiryDate
                                                ? new Date(med.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                : <span className="text-slate-400 italic">Not Set</span>}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(med)}
                                                    className="text-sm font-medium text-emerald-600 hover:text-emerald-800 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-200"
                                                >
                                                    Update
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMedication(med._id)}
                                                    className="text-sm font-medium text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-slate-500 font-medium">No medications found for this category.</p>
                    </div>
                )}
            </div>

            {selectedCategory !== 'All' && (
                <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Prescriptions for {selectedCategory}</h3>
                        <div className="h-px flex-1 bg-slate-100"></div>
                    </div>

                    {filteredPrescs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredPrescs.map((presc, index) => (
                                <div key={index} className="bg-white border border-slate-100 rounded-xl p-5 hover:shadow-md transition-shadow flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 leading-tight">{presc.name}</h4>
                                            <p className="text-xs text-slate-400 mt-1">{new Date(presc.uploadDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`${backendUrl}${presc.fileUrl}`}
                                        target="_blank" rel="noreferrer"
                                        className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-slate-400 text-sm">No prescriptions found for this category.</p>
                        </div>
                    )}
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
                                <label className="block text-sm font-medium text-slate-700 mb-2">Stock Count</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step={allowsDecimal(newDosageUnit) ? "0.01" : "1"}
                                        value={newStockCount}
                                        onChange={(e) => setNewStockCount(e.target.value)}
                                        required
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                                    />
                                    <select
                                        value={newDosageUnit}
                                        onChange={(e) => setNewDosageUnit(e.target.value)}
                                        className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm"
                                    >
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Stock Count</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step={allowsDecimal(addDosageUnit) ? "0.01" : "1"}
                                        value={addStockCount}
                                        onChange={(e) => setAddStockCount(e.target.value)}
                                        required
                                        className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                                    />
                                    <select
                                        value={addDosageUnit}
                                        onChange={(e) => setAddDosageUnit(e.target.value)}
                                        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm"
                                    >
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Expiration Date</label>
                                <input
                                    type="date"
                                    value={addExpiryDate}
                                    onChange={(e) => setAddExpiryDate(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors appearance-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Heart, Diabetes"
                                    value={addCategory}
                                    onChange={(e) => setAddCategory(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
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
