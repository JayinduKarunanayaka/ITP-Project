import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import PatientSidebar from '../components/PatientSidebar';

const PatientDetails = () => {
    const { patientId } = useParams(); 
    const navigate = useNavigate();
    const { backendUrl } = useContext(AppContent);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [patientData, setPatientData] = useState(null);

    const fetchPatientDetails = async () => {
        try {
            setLoading(true);
            // Matches backend expectation for URL params
            const { data } = await axios.get(
                `${backendUrl}/api/user/get-patient-by-id/${patientId}`, 
                { withCredentials: true }
            );
            
            if (data.success) {
                setPatientData(data.patient);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Error loading profile");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            // Your controller expects _id in the body for updatePatient
            const { data } = await axios.post(
                `${backendUrl}/api/user/update-patient`, 
                { _id: patientId, ...patientData }, 
                { withCredentials: true }
            );
            if (data.success) {
                toast.success("Profile updated successfully");
                setIsEditing(false);
                fetchPatientDetails();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to update");
        }
    };

    // Logout functionality to return to dashboard
    const handleLogout = () => {
        navigate('/caretaker-dashboard');
    };

    useEffect(() => { 
        if (patientId) fetchPatientDetails(); 
    }, [patientId]);

    if (loading) return <div className='p-10 text-center'>Loading Profile...</div>;

    return (
        <div className='flex min-h-screen bg-white'>
            <PatientSidebar patientName={patientData?.name} />

            <main className='flex-1 p-8 bg-emerald-50/20 overflow-y-auto'>
                <div className='max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-emerald-100'>
                    
                    <div className='flex justify-between items-center mb-8 border-b pb-4 border-emerald-50'>
                        <div>
                            <h1 className='text-2xl font-bold text-emerald-900'>Detailed Profile</h1>
                            <p className='text-sm text-emerald-500 font-medium'>Manage all medical records</p>
                        </div>
                        <div className='flex gap-3'>
                            <button onClick={() => navigate('/caretaker-dashboard')} className='px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all'>
                                Exit to Dashboard
                            </button>
                            <button 
                                onClick={() => setIsEditing(!isEditing)}
                                className={`px-6 py-2 rounded-xl font-bold transition-all shadow-sm ${
                                    isEditing ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                }`}
                            >
                                {isEditing ? 'Cancel' : 'Edit Details'}
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleUpdate} className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'>
                        {/* Name */}
                        <div className='flex flex-col gap-1'>
                            <label className='text-[10px] font-bold text-emerald-800 uppercase ml-1'>Full Name</label>
                            <input type="text" disabled={!isEditing} className={`p-3 rounded-xl border outline-none ${isEditing ? 'border-emerald-300' : 'border-transparent bg-gray-50'}`} value={patientData?.name || ''} onChange={(e) => setPatientData({...patientData, name: e.target.value})} />
                        </div>

                        {/* Birthday & Age */}
                        <div className='flex flex-col gap-1'>
                            <label className='text-[10px] font-bold text-emerald-800 uppercase ml-1'>Birthday</label>
                            <input type="date" disabled={!isEditing} className={`p-3 rounded-xl border outline-none ${isEditing ? 'border-emerald-300' : 'border-transparent bg-gray-50'}`} value={patientData?.birthday ? patientData.birthday.split('T')[0] : ''} onChange={(e) => setPatientData({...patientData, birthday: e.target.value})} />
                        </div>

                        {/* Gender */}
                        <div className='flex flex-col gap-1'>
                            <label className='text-[10px] font-bold text-emerald-800 uppercase ml-1'>Gender</label>
                            <select disabled={!isEditing} className={`p-3 rounded-xl border outline-none ${isEditing ? 'border-emerald-300' : 'border-transparent bg-gray-50'}`} value={patientData?.gender || ''} onChange={(e) => setPatientData({...patientData, gender: e.target.value})}>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Language */}
                        <div className='flex flex-col gap-1'>
                            <label className='text-[10px] font-bold text-emerald-800 uppercase ml-1'>Primary Language</label>
                            <input type="text" disabled={!isEditing} className={`p-3 rounded-xl border outline-none ${isEditing ? 'border-emerald-300' : 'border-transparent bg-gray-50'}`} value={patientData?.primaryLanguage || ''} onChange={(e) => setPatientData({...patientData, primaryLanguage: e.target.value})} />
                        </div>

                        {/* Contact & Email */}
                        <div className='flex flex-col gap-1'>
                            <label className='text-[10px] font-bold text-emerald-800 uppercase ml-1'>Contact Number</label>
                            <input type="text" disabled={!isEditing} className={`p-3 rounded-xl border outline-none ${isEditing ? 'border-emerald-300' : 'border-transparent bg-gray-50'}`} value={patientData?.mobile || ''} onChange={(e) => setPatientData({...patientData, mobile: e.target.value})} />
                        </div>

                        <div className='flex flex-col gap-1'>
                            <label className='text-[10px] font-bold text-emerald-800 uppercase ml-1'>Email Address</label>
                            <input type="email" disabled={!isEditing} className={`p-3 rounded-xl border outline-none ${isEditing ? 'border-emerald-300' : 'border-transparent bg-gray-50'}`} value={patientData?.email || ''} onChange={(e) => setPatientData({...patientData, email: e.target.value})} />
                        </div>

                        {/* Pharmacy Number */}
                        <div className='flex flex-col gap-1'>
                            <label className='text-[10px] font-bold text-emerald-800 uppercase ml-1'>Pharmacy Number</label>
                            <input type="text" disabled={!isEditing} className={`p-3 rounded-xl border outline-none ${isEditing ? 'border-emerald-300' : 'border-transparent bg-gray-50'}`} value={patientData?.pharmacyNumber || ''} onChange={(e) => setPatientData({...patientData, pharmacyNumber: e.target.value})} />
                        </div>

                        {/* Emergency Contact */}
                        <div className='flex flex-col gap-1 md:col-span-2 mt-4 p-5 bg-rose-50 rounded-2xl'>
                            <label className='text-xs font-bold text-rose-800 uppercase ml-1'>Emergency Contact Information</label>
                            <input type="text" disabled={!isEditing} className={`p-3 rounded-xl border outline-none ${isEditing ? 'border-rose-300 bg-white' : 'border-transparent bg-transparent text-rose-700 font-bold text-lg'}`} value={patientData?.emergencyContact || ''} onChange={(e) => setPatientData({...patientData, emergencyContact: e.target.value})} />
                        </div>

                        {isEditing && (
                            <button type="submit" className='md:col-span-2 bg-emerald-700 text-white py-4 rounded-xl font-bold hover:bg-emerald-800 transition-all'>
                                Save and Update Database
                            </button>
                        )}
                    </form>
                </div>
            </main>
        </div>
    );
};

export default PatientDetails;