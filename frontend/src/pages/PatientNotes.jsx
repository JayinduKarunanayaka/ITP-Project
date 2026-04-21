import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AppContent } from '../context/AppContext';
import PatientSidebar from '../components/PatientSidebar';

const PatientNotes = () => {
    // 1. MUST BE 'patientId' to match <Route path='/patient/:patientId/helthNotes' />
    const { patientId } = useParams(); 
    const { backendUrl } = useContext(AppContent);
    const [patient, setPatient] = useState(null);

    useEffect(() => {
            const fetchPatientData = async () => {
                if (!patientId) return;

                try {
                    // CHANGED: Using axios.get and putting the ID in the URL path
                    // This matches: const { patientId } = req.params; in your controller
                    const { data } = await axios.get(
                        `${backendUrl}/api/user/get-patient/${patientId}`, 
                        { withCredentials: true }
                    );

                    if (data.success) {
                        setPatient(data.patient);
                    } else {
                        console.error("Backend Error:", data.message);
                    }
                } catch (error) {
                    console.error("Axios Error:", error);
                }
            };

            fetchPatientData();
        }, [patientId, backendUrl]);

    return (
        <div className='flex min-h-screen bg-white'>
            <PatientSidebar patientName={patient?.name} />
            <main className='flex-1 p-12'>
                <h1 className='text-2xl font-bold text-emerald-900'>
                    Health Notes — <span className='text-emerald-500'>{patient?.name || 'Loading...'}</span>
                </h1>
                <p className='text-gray-400 text-sm mt-1'>Create Helth notes.</p>
            </main>
        </div>
    );
};

export default PatientNotes;