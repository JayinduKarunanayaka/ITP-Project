import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AppContent } from '../context/AppContext';
import PatientSidebar from '../components/PatientSidebar';

const PatientInfo = () => {
    // This must match ':patientId' in your App.jsx routes
    const { patientId } = useParams(); 
    const { backendUrl } = useContext(AppContent);
    const [patient, setPatient] = useState(null);

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                // CHANGED: Switching to GET and putting patientId in the URL string
                // This matches your controller's: const { patientId } = req.params;
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
                <div className='max-w-5xl'>
                    <h1 className='text-2xl font-bold text-emerald-900'>
                        Medical & Support Information — <span className='text-emerald-500'>{patient?.name || 'Loading...'}</span>
                    </h1>
                    <p className='text-gray-400 text-sm mt-1'>Viewing complete medical profile for this patient.</p>
                </div>
            </main>
        </div>
    );
};

export default PatientInfo;