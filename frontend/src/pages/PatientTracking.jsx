import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AppContent } from '../context/AppContext.jsx';
import PatientSidebar from '../components/PatientSidebar.jsx';
import '../assets/tracking-theme.css';

import IntakeVisualization from '../components/Tracking/IntakeVisualization.jsx';
import AdherenceSummary from '../components/Tracking/AdherenceSummary.jsx';
import MedicationLogs from '../components/Tracking/MedicationLogs.jsx';
import BmiTrackingTile from '../components/Tracking/BmiTrackingTile.jsx';
import TimingAccuracy from '../components/Tracking/TimingAccuracy.jsx';
import MissedDoseAlert from '../components/Tracking/MissedDoseAlert.jsx';

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

const PatientTracking = () => {
    const { patientId } = useParams();
    const { backendUrl } = useContext(AppContent);
    const [patient, setPatient] = useState(null);
    const [stats, setStats] = useState({ adherence: 0, taken: 0, missed: 0, total: 0 });
    const [chartRange, setChartRange] = useState('weekly');
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchPatientData = async () => {
        if (!patientId) return;

        try {
            // CHANGED: Using axios.get and putting the ID in the URL path
            // This matches: const { patientId } = req.params; in your controller
            const { data } = await axios.get(
                `${backendUrl}/api/user/get-patient/${patientId}`,
                { headers: getAuthHeaders() }
            );

            if (data.success) {
                setPatient(data.patient);

                // Fire off the secondary request mapping tracking math exclusively handled by backend trackingService
                const statsRes = await axios.get(
                    `${backendUrl}/api/tracking/adherence/${patientId}?type=${chartRange}`,
                    { headers: getAuthHeaders() }
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

    useEffect(() => {
        fetchPatientData();
    }, [patientId, backendUrl, chartRange]);

    const timingInsight = stats.missed > stats.late
        ? 'Missed doses dominate the current window. Strengthen reminder coverage during the highest-risk period.'
        : stats.late > 0
            ? 'Most timing issues are late doses. Nudging reminders earlier can improve on-time adherence.'
            : 'Your timing profile is stable. Keep the current reminder cadence.';

    return (
        <div className='flex min-h-screen bg-white'>
            <PatientSidebar patientName={patient?.name} />
            <main className='flex-1 p-6 md:p-12'>
                <div className='max-w-6xl mx-auto w-full'>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <h1 className='text-2xl font-bold text-emerald-900 mb-0'>
                            Adherence Tracking — <span className='text-emerald-500'>{patient?.name || 'Loading...'}</span>
                        </h1>
                    </div>

                    <MissedDoseAlert adherencePercentage={stats.adherence || 0} onClose={() => {}} />

                    {/* Native Dash Layout Mapping components natively styling tracking-theme.css */}
                    <div id="tracking-dashboard-content" className="dashboard-grid bg-emerald-50 p-2 md:p-6 rounded-2xl">
                        <AdherenceSummary
                            percentage={stats.adherence || 0}
                            daysLogged={stats.taken || 0}
                            streak={stats.total > 0 ? 3 : 0}
                            backendUrl={backendUrl}
                            patientId={patientId}
                            reportFilename={`${patient?.name ? patient.name.replace(/\s+/g, '_') : 'Patient'}_Tracking_Report.pdf`}
                        />

                        <BmiTrackingTile patientId={patientId} refreshTrigger={refreshKey} />

                        <TimingAccuracy data={{
                            onTime: stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 0,
                            late: stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0,
                            missed: stats.total > 0 ? Math.round((stats.missed / stats.total) * 100) : 0
                        }} insight={timingInsight} />

                        <IntakeVisualization
                            pieDataValues={[
                                stats.onTime || 0,
                                stats.late || 0,
                                stats.missed || 0
                            ]}
                            barDataValues={stats.weeklyDistribution || { onTime: [0, 0, 0, 0, 0, 0, 0], missed: [0, 0, 0, 0, 0, 0, 0], labels: [] }}
                            activeRange={chartRange}
                            onRangeChange={setChartRange}
                        />

                        <MedicationLogs
                            patientId={patientId}
                            onLogAdded={() => { fetchPatientData(); setRefreshKey(prev => prev + 1); }}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PatientTracking;