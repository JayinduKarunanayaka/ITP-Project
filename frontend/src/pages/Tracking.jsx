import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContent } from '../context/AppContext.jsx';
import LoggedIn from '../components/loggedin.jsx';
import { toPng } from 'html-to-image';
import * as jsPDF from 'jspdf';
import '../assets/tracking-theme.css'; 

import IntakeVisualization from '../components/Tracking/IntakeVisualization.jsx';
import AdherenceSummary from '../components/Tracking/AdherenceSummary.jsx';
import MedicationLogs from '../components/Tracking/MedicationLogs.jsx';
import BmiTrackingTile from '../components/Tracking/BmiTrackingTile.jsx';
import TimingAccuracy from '../components/Tracking/TimingAccuracy.jsx';

const Tracking = () => {
    const { backendUrl, userData } = useContext(AppContent);
    const [stats, setStats] = useState({ adherence: 0, taken: 0, missed: 0, total: 0 });
    const [chartRange, setChartRange] = useState('weekly');
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchTrackingData = async () => {
        if (!userData || !userData._id) return;

        try {
            // Fetch the adherence directly matching the logged-in patient's own ID
            const { data } = await axios.get(
                `${backendUrl}/api/tracking/adherence/${userData._id}?type=${chartRange}`,
                { withCredentials: true }
            );

            if (data.success) {
                setStats(data);
            } else {
                console.error("Tracking API Error:", data.message);
            }
        } catch (error) {
            console.error("Axios Tracking Integration Error:", error);
        }
    };

    useEffect(() => {
        fetchTrackingData();
    }, [backendUrl, userData, chartRange]);

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
            // Calculate height keeping aspect ratio (assume a standard 1200x800 desktop ratio approx)
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.setFontSize(18);
            pdf.text('Visual Tracking & Adherence Report', 14, 20);
            
            pdf.setFontSize(11);
            pdf.setTextColor(100);
            pdf.text(`Patient: ${userData?.name || 'Personal'}`, 14, 30);
            pdf.text(`Generated On: ${new Date().toLocaleString()}`, 14, 37);
            
            pdf.addImage(dataUrl, 'PNG', 0, 45, pdfWidth, pdfHeight);
            pdf.save(`${userData?.name ? userData.name.replace(/\s+/g, '_') : 'Personal'}_Tracking_Report.pdf`);
            
        } catch (error) {
            alert(`PDF failed to render due to browser graphical security: ${error.message || error}`);
            console.error("Error generating PDF graphic snapshot", error);
        }
    };

    return (
        <LoggedIn>
            <div className="max-w-6xl mx-auto w-full">
                <div className="mb-8 border-b border-emerald-100 pb-6 flex justify-between items-center pr-4">
                    <div>
                        <h1 className='text-3xl sm:text-4xl font-black text-emerald-900 mb-2'>
                            Personal Tracking & Logging
                        </h1>
                        <p className='text-emerald-700 text-sm sm:text-base'>
                            Monitor your medication routines and personal intake logs.
                        </p>
                    </div>
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
                        patientId={userData._id}
                    />

                    <BmiTrackingTile patientId={userData._id} refreshTrigger={refreshKey} />

                    <TimingAccuracy data={{
                        onTime: stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 0,
                        late: stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0,
                        missed: stats.total > 0 ? Math.round((stats.missed / stats.total) * 100) : 0
                    }} />
                    
                    <IntakeVisualization 
                        pieDataValues={[
                            stats.onTime || 0,
                            stats.late || 0,
                            stats.missed || 0
                        ]}
                        barDataValues={stats.weeklyDistribution || { onTime: [0,0,0,0,0,0,0], missed: [0,0,0,0,0,0,0], labels: [] }}
                        activeRange={chartRange}
                        onRangeChange={setChartRange}
                    />
                    
                    <MedicationLogs 
                        patientId={userData?._id} 
                        onLogAdded={() => { fetchTrackingData(); setRefreshKey(prev => prev + 1); }} 
                    />
                </div>
            </div>
        </LoggedIn>
    );
};

export default Tracking;
