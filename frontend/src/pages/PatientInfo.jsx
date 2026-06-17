import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AppContent } from '../context/AppContext';
import PatientSidebar from '../components/PatientSidebar';
import PatientMedications from '../components/PatientMedications';
import PatientBMI from '../components/PatientBMI';
import PatientAppointments from '../components/PatientAppointments';
import PatientRecords from '../components/PatientRecords';
import PatientAllergies from '../components/PatientAllergies';

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

const PatientInfo = () => {
    const { patientId } = useParams(); 
    const { backendUrl } = useContext(AppContent);
    const [patient, setPatient] = useState(null);
    const [activeTab, setActiveTab] = useState('medications');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'medications': return <PatientMedications patientId={patientId} />;
            case 'bmi': return <PatientBMI patientId={patientId} />;
            case 'appointments': return <PatientAppointments patientId={patientId} />;
            case 'records': return <PatientRecords patientId={patientId} />;
            case 'allergies': return <PatientAllergies patientId={patientId} />;
            default: return <PatientMedications patientId={patientId} />;
        }
    };

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                const { data } = await axios.get(
                    `${backendUrl}/api/user/get-patient/${patientId}`, 
                    { headers: getAuthHeaders() }
                );

                if (data.success) {
                    setPatient(data.patient);
                } else {
                    console.error("Backend error:", data.message);
                }
            } catch (error) {
                console.error("Request failed:", error);
            }
        };

        if (patientId) {
            fetchPatientData();
        }
    }, [patientId, backendUrl]);

    return (
        <div className='flex min-h-screen bg-white'>
            {/* Pass name to sidebar for the profile icon/initials */}
            <PatientSidebar patientName={patient?.name} />

            <main className='flex-1 p-12'>
                <div className='max-w-5xl mx-auto'>
                    <div className='mb-8 border-b border-emerald-100 pb-6'>
                        <h1 className='text-2xl font-bold text-emerald-900'>
                            Medical & Support Information — <span className='text-emerald-500'>{patient?.name || 'Loading...'}</span>
                        </h1>
                        <p className='text-gray-400 text-sm mt-1'>Viewing complete medical profile for this patient.</p>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex overflow-x-auto mb-8 no-scrollbar bg-white p-2 rounded-2xl shadow-sm border border-emerald-100 gap-2">
                        <button
                            onClick={() => setActiveTab('medications')}
                            className={`flex-1 py-3 px-4 font-bold text-sm sm:text-base rounded-xl whitespace-nowrap transition-all ${activeTab === 'medications' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
                        >
                            Medications
                        </button>
                        <button
                            onClick={() => setActiveTab('bmi')}
                            className={`flex-1 py-3 px-4 font-bold text-sm sm:text-base rounded-xl whitespace-nowrap transition-all ${activeTab === 'bmi' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
                        >
                            BMI Tracker
                        </button>
                        <button
                            onClick={() => setActiveTab('appointments')}
                            className={`flex-1 py-3 px-4 font-bold text-sm sm:text-base rounded-xl whitespace-nowrap transition-all ${activeTab === 'appointments' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
                        >
                            Appointments
                        </button>
                        <button
                            onClick={() => setActiveTab('records')}
                            className={`flex-1 py-3 px-4 font-bold text-sm sm:text-base rounded-xl whitespace-nowrap transition-all ${activeTab === 'records' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
                        >
                            Medical Records
                        </button>
                        <button
                            onClick={() => setActiveTab('allergies')}
                            className={`flex-1 py-3 px-4 font-bold text-sm sm:text-base rounded-xl whitespace-nowrap transition-all ${activeTab === 'allergies' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
                        >
                            Allergies
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="transition-all duration-300 ease-in-out">
                        {renderTabContent()}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PatientInfo;