import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const CaretakerDashboard = () => {
    const { backendUrl, userData, getUserData } = useContext(AppContent);
    const [patients, setPatients] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        birthday: '',
        gender: 'Male',
        mobile: '',
        email: '', 
        primaryLanguage: 'Sinhala',
        pharmacyNumber: '',
        emergencyContact: ''
    });

    const calculateAge = (birthday) => {
        if (!birthday) return '';
        const today = new Date();
        const birthDate = new Date(birthday);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 0 ? age : 0;
    };

    const readSavedSessionToken = () => {
        try {
            return window.localStorage.getItem('med_app_auth_token') || '';
        } catch {
            return '';
        }
    };

    const getAuthHeaders = useCallback(() => {
        const token = readSavedSessionToken();
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }, []);

    const fetchMyPatients = useCallback(async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/my-patients', { headers: getAuthHeaders() });
            if (data.success) setPatients(data.patients);
        } catch (error) {
            console.error("Error fetching patients", error);
        }
    }, [backendUrl, getAuthHeaders]);

    // --- ENHANCED VALIDATION LOGIC ---
    const handleCreatePatient = async (e) => {
        e.preventDefault();

        const nameRegex = /^[A-Za-z\s]+$/;
        const phoneRegex = /^\+?[0-9]+$/;

        // 1. Name Validation
        if (!formData.name.trim()) {
            return toast.error("Patient name is required");
        } else if (!nameRegex.test(formData.name)) {
            return toast.error("Patient name can only contain letters");
        }

        // 2. Birthday Validation
        if (formData.birthday) {
            const birthDate = new Date(formData.birthday);
            if (birthDate > new Date()) {
                return toast.error("Birthday cannot be in the future");
            }
        }

        // 3. Contact Number Validations
        if (!phoneRegex.test(formData.mobile)) {
            return toast.error("Valid mobile number is required");
        }
        if (formData.pharmacyNumber && !phoneRegex.test(formData.pharmacyNumber)) {
            return toast.error("Pharmacy number must be numeric");
        }
        if (!phoneRegex.test(formData.emergencyContact)) {
            return toast.error("Valid emergency contact is required");
        }

        try {
            const { data } = await axios.post(backendUrl + '/api/user/create-patient', formData, { headers: getAuthHeaders() });
            if (data.success) {
                toast.success(data.message);
                await getUserData(); 
                setFormData({ 
                    name: '', birthday: '', gender: 'Male', mobile: '', 
                    email: '', primaryLanguage: 'Sinhala', pharmacyNumber: '', emergencyContact: '' 
                });
                setShowCreateForm(false);
                fetchMyPatients();
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error("Failed to create patient");
        }
    };

    const removePatient = async (patientId) => {
        if (!window.confirm("Are you sure you want to remove this patient?")) return;

        try {
            const { data } = await axios.post(backendUrl + '/api/user/remove-patient', { patientId }, { headers: getAuthHeaders() });
            if (data.success) {
                toast.success("Patient removed successfully");
                await getUserData(); 
                fetchMyPatients(); 
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        fetchMyPatients();
    }, [fetchMyPatients]);

    return (
        <div className='p-6 sm:p-10 bg-emerald-50 min-h-screen'>
            <div className='max-w-6xl mx-auto'>
                
                <div className='flex justify-end'>
                    <button 
                        onClick={() => navigate('/medication')} 
                        className='flex items-center gap-2 text-emerald-700 font-semibold mb-6 hover:text-emerald-900 transition-all group'
                    >
                        <span className='group-hover:-translate-x-1 transition-transform'>←</span> 
                        Back to Medications
                    </button>
                </div>

                <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10'>
                    <div>
                        <h1 className='text-3xl font-bold text-emerald-900'>Patient Management</h1>
                        <p className='text-emerald-600 font-medium'>Caretaker: {userData?.name}</p>
                    </div>
                    <button 
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className={`px-6 py-3 rounded-xl font-bold transition-all shadow-md ${showCreateForm ? 'bg-gray-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                        {showCreateForm ? 'Close Form' : '+ Add New Patient'}
                    </button>
                </div>

                {showCreateForm && (
                    <div className='bg-white p-8 rounded-3xl shadow-xl border border-emerald-100 mb-10 animate-in fade-in duration-300'>
                        <h2 className='text-xl font-bold mb-6 text-gray-800 border-b pb-2 border-emerald-50'>Register Patient</h2>
                        <form onSubmit={handleCreatePatient} className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            
                            {/* Filtered Name Input */}
                            <div className='flex flex-col gap-1'>
                                <label className='text-sm font-semibold text-gray-600 ml-1'>Full Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Patient Name" 
                                    className='p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 outline-none focus:ring-2 focus:ring-emerald-400' 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value.replace(/[^A-Za-z\s]/g, '')})} 
                                    required 
                                />
                            </div>

                            <div className='flex flex-col gap-1'>
                                <label className='text-sm font-semibold ml-1 text-emerald-800'>
                                    Birthday (Age: {calculateAge(formData.birthday)})
                                </label>
                                <input type="date" className='p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 outline-none' 
                                    value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} required />
                            </div>

                            <div className='flex flex-col gap-1'>
                                <label className='text-sm font-semibold text-gray-600 ml-1'>Gender</label>
                                <select className='p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 outline-none'
                                    value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Filtered Mobile Input */}
                            <div className='flex flex-col gap-1'>
                                <label className='text-sm font-semibold text-gray-600 ml-1'>Contact Number</label>
                                <input 
                                    type="text" 
                                    placeholder="Mobile Number" 
                                    className='p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 outline-none' 
                                    value={formData.mobile} 
                                    onChange={e => setFormData({...formData, mobile: e.target.value.replace(/[^0-9+]/g, '')})} 
                                    required 
                                />
                            </div>

                            <div className='flex flex-col gap-1'>
                                <label className='text-sm font-semibold text-gray-600 ml-1'>Email Address (Optional)</label>
                                <input type="email" placeholder="Optional Email" className='p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 outline-none' 
                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>

                            {/* Filtered Pharmacy Number */}
                            <div className='flex flex-col gap-1'>
                                <label className='text-sm font-semibold text-gray-600 ml-1'>Pharmacy Number</label>
                                <input 
                                    type="text" 
                                    placeholder="Pharmacy Phone" 
                                    className='p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 outline-none' 
                                    value={formData.pharmacyNumber} 
                                    onChange={e => setFormData({...formData, pharmacyNumber: e.target.value.replace(/[^0-9+]/g, '')})} 
                                />
                            </div>

                            {/* Filtered Emergency Number */}
                            <div className='flex flex-col gap-1'>
                                <label className='text-sm font-semibold text-gray-600 ml-1'>Emergency Number</label>
                                <input 
                                    type="text" 
                                    placeholder="Emergency Contact" 
                                    className='p-3 rounded-xl border border-rose-100 bg-rose-50/30 outline-none' 
                                    value={formData.emergencyContact} 
                                    onChange={e => setFormData({...formData, emergencyContact: e.target.value.replace(/[^0-9+]/g, '')})} 
                                    required 
                                />
                            </div>

                            <button className='md:col-span-2 bg-emerald-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg mt-2'>
                                Register Patient Under My Care
                            </button>
                        </form>
                    </div>
                )}

                <h2 className='text-xl font-bold text-emerald-900 mb-6'>Currently Managed Patients</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {patients.length > 0 ? (
                        patients.map(patient => (
                            <div key={patient._id} className='bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 hover:shadow-md transition-all relative group'>
                                <button 
                                    onClick={() => removePatient(patient._id)}
                                    className='absolute top-4 right-4 text-gray-300 hover:text-rose-500 transition-colors p-2'
                                    title="Remove Patient"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>

                                <div className='flex items-center gap-4 mb-4'>
                                    <div className='w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-lg'>
                                        {patient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className='font-bold text-gray-800 text-lg leading-tight'>{patient.name}</h3>
                                        <p className='text-xs text-emerald-600 font-medium'>{patient.email?.includes('@noemail.com') ? 'No Email Provided' : patient.email}</p>
                                    </div>
                                </div>

                                <div className='space-y-2 text-sm text-gray-600 pt-3 border-t border-emerald-50'>
                                    <div className='flex justify-between'>
                                        <span className='font-medium text-gray-500'>Gender & Age:</span>
                                        <span className='text-gray-800 font-bold'>
                                            {patient.gender || 'Not Set'} ({calculateAge(patient.birthday)} yrs)
                                        </span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='font-medium text-gray-500'>Language:</span>
                                        <span className='text-emerald-700 font-bold'>{patient.primaryLanguage || 'English'}</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='font-medium'>Mobile:</span>
                                        <span className='text-gray-800'>{patient.mobile || 'N/A'}</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='font-medium'>Pharmacy:</span>
                                        <span className='text-gray-800'>{patient.pharmacyNumber || 'N/A'}</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => navigate(`/patient/${patient._id}/info`)}
                                    className='w-full mt-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-black transition-all shadow-md'
                                >
                                    View Medication
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className='col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-emerald-200'>
                            <p className='text-gray-400 font-medium'>No patients registered yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CaretakerDashboard;