import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AppContent } from '../context/AppContext';
import PatientSidebar from '../components/PatientSidebar';

const PatientInventory = () => {
    // patientId comes from the URL defined in App.jsx
    const { patientId } = useParams(); 
    const { backendUrl } = useContext(AppContent);
    const [patient, setPatient] = useState(null);

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                // UPDATED: Using axios.get to match your backend's req.params
                // URL: /api/user/get-patient/ID_HERE
                const { data } = await axios.get(
                    `${backendUrl}/api/user/get-patient/${patientId}`, 
                    { withCredentials: true }
                );

                if (data.success) {
                    setPatient(data.patient);
                } else {
                    console.error("Backend error:", data.message);
                }
            } catch (error) {
                console.error("Network or Server Error:", error);
            }
        };

        if (patientId) {
            fetchPatientData();
        }
    }, [patientId, backendUrl]);

    return (
        <div className='flex min-h-screen bg-white'>
            {/* Sidebar receives the name for the profile circle at the bottom */}
            <PatientSidebar patientName={patient?.name} />
            
            <main className='flex-1 p-12'>
                <div className='max-w-5xl'>
                    <h1 className='text-2xl font-bold text-emerald-900'>
                        Inventory — <span className='text-emerald-500'>{patient?.name || 'Loading...'}</span>
                    </h1>
                    <p className='text-gray-400 text-sm mt-1'>Manage medication stock levels for this patient.</p>
                </div>
            </main>
        </div>
    );
};

export default PatientInventory;