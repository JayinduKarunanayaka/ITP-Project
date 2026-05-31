import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AppContent } from '../context/AppContext.jsx';
import PatientSidebar from '../components/PatientSidebar.jsx';
import { toPng } from 'html-to-image';
import * as jsPDF from 'jspdf';
import '../assets/tracking-theme.css'; 

import IntakeVisualization from '../components/Tracking/IntakeVisualization.jsx';
import AdherenceSummary from '../components/Tracking/AdherenceSummary.jsx';
import MedicationLogs from '../components/Tracking/MedicationLogs.jsx';

const PatientTracking = () => {
    const { patientId } = useParams();
    const { backendUrl } = useContext(AppContent);
    const [patient, setPatient] = useState(null);
    const [stats, setStats] = useState({ adherence: 0, taken: 0, missed: 0, total: 0 });
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
                        
                        // Fire off the secondary request mapping tracking math exclusively handled by backend trackingService
                        const statsRes = await axios.get(
                            `${backendUrl}/api/tracking/adherence/${patientId}?type=monthly`,
                            { withCredentials: true }
                        );
                        if (statsRes.data.success) {
                            setStats(statsRes.data);
                        }
                    } else {
                        console.error("Backend Error:", data.message);
                    }
                } catch (error) {
                    console.error("Axios Tracking Integration Error:", error);
                }
            };

            fetchPatientData();
        }, [patientId, backendUrl]);

    const exportToPDF = async () => {
        const input = document.getElementById('tracking-dashboard-content');
        if (!input) {
            alert("Error: Core dashboard element missing from render tree!");
            return;
        }
        
        try {
            const dataUrl = await toPng(input, {
                quality: 0.95,
                backgroundColor: '#ffffff',
                cacheBust: true,
                style: { transform: 'scale(1)', transformOrigin: 'top left' }
            });
            
            // Explicitly resolve both ESModule named exports and strict CommonJS defaults natively
            const PDFConstructor = jsPDF.jsPDF || jsPDF.default || jsPDF;
            const pdf = new PDFConstructor('p', 'mm', 'a4');
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.setFontSize(18);
            pdf.text('Visual Tracking & Adherence Report', 14, 20);
            
            pdf.setFontSize(11);
            pdf.setTextColor(100);
            pdf.text(`Patient: ${patient?.name || 'Loading...'}`, 14, 30);
            pdf.text(`Generated On: ${new Date().toLocaleString()}`, 14, 37);
            
            pdf.addImage(dataUrl, 'PNG', 0, 45, pdfWidth, pdfHeight);
            pdf.save(`${patient?.name ? patient.name.replace(/\s+/g, '_') : 'Patient'}_Tracking_Report.pdf`);
            
        } catch (error) {
            alert(`PDF failed to render due to browser graphical security: ${error.message || error}`);
            console.error("Error generating PDF graphic snapshot", error);
        }
    };

    return (
        <div className='flex min-h-screen bg-white'>
            <PatientSidebar patientName={patient?.name} />
            <main className='flex-1 p-12'>
                <div className='max-w-6xl w-full'>
                    <div className="flex justify-between items-center mb-6">
                        <h1 className='text-2xl font-bold text-emerald-900 mb-0'>
                            Adherence Tracking — <span className='text-emerald-500'>{patient?.name || 'Loading...'}</span>
                        </h1>
                        <button onClick={exportToPDF} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem' }}>
                            <i className="fa-solid fa-download"></i> Download Report
                        </button>
                    </div>
                    
                    {/* Native Dash Layout Mapping components natively styling tracking-theme.css */}
                    <div id="tracking-dashboard-content" className="dashboard-grid bg-emerald-50 p-2 md:p-6 rounded-2xl">
                        <AdherenceSummary 
                            percentage={stats.adherence || 0}
                            daysLogged={stats.taken || 0}
                            streak={stats.total > 0 ? 3 : 0} 
                            backendUrl={backendUrl}
                            patientId={patientId}
                        />
                        
                        <IntakeVisualization 
                            pieDataValues={[
                                stats.taken || 0,
                                0, // Late (not implemented fully in mock)
                                stats.missed || 0
                            ]}
                            barDataValues={stats.weeklyDistribution || { onTime: [0,0,0,0,0,0,0], missed: [0,0,0,0,0,0,0] }}
                        />
                        
                        <MedicationLogs />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PatientTracking;