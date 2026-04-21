import React, { useState, useContext } from 'react';
import LoggedIn from '../components/loggedin';
import PatientMedications from '../components/PatientMedications';
import PatientBMI from '../components/PatientBMI';
import PatientAppointments from '../components/PatientAppointments';
import PatientRecords from '../components/PatientRecords';
import PatientAllergies from '../components/PatientAllergies';
import { AppContent } from '../context/AppContext';

const Medication = () => {
    const { userData } = useContext(AppContent);
    const [activeTab, setActiveTab] = useState('medications');

    const patientId = userData?._id; // logged-in patient id, reused in all patient components

    const renderTabContent = () => {
        switch (activeTab) {
            case 'medications':
                return <PatientMedications patientId={patientId} />;
            case 'bmi':
                return <PatientBMI patientId={patientId} />;
            case 'appointments':
                return <PatientAppointments patientId={patientId} />;
            case 'records':
                return <PatientRecords patientId={patientId} />;
            case 'allergies':
                return <PatientAllergies patientId={patientId} />;
            default:
                return <PatientMedications patientId={patientId} />;
        }
    };

    return (
        <LoggedIn>
            <div className="max-w-7xl mx-auto w-full">
                <div className="mb-8 border-b border-emerald-100 pb-6">
                    <h1 className="text-3xl sm:text-4xl font-black text-emerald-900">Patient Dashboard</h1>
                    <p className="text-emerald-700 mt-2 text-sm sm:text-base">Manage your health records, medications, and appointments safely and easily.</p>
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
        </LoggedIn>
    );
};

export default Medication;