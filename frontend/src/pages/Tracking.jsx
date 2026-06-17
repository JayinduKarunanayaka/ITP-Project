import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AppContent } from '../context/AppContext.jsx';
import LoggedIn from '../components/loggedin.jsx';
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

const Tracking = () => {
    const { backendUrl, userData } = useContext(AppContent);
    const [stats, setStats] = useState({ adherence: 0, taken: 0, missed: 0, total: 0 });
    const [chartRange, setChartRange] = useState('weekly');
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchTrackingData = useCallback(async () => {
        if (!userData || !userData._id) return;

        try {
            const { data } = await axios.get(
                `${backendUrl}/api/tracking/adherence/${userData._id}?type=${chartRange}`,
                { headers: getAuthHeaders() }
            );

            if (data.success) {
                setStats(data);
            } else {
                console.error("Tracking API Error:", data.message);
            }
        } catch (error) {
            console.error("Axios Tracking Integration Error:", error);
        }
    }, [backendUrl, userData, chartRange]);

    useEffect(() => {
        (async () => {
            await fetchTrackingData();
        })();
    }, [fetchTrackingData]);

    const timingInsight = stats.missed > stats.late
        ? 'Missed doses dominate the current window. Strengthen reminder coverage during the highest-risk period.'
        : stats.late > 0
            ? 'Most timing issues are late doses. Nudging reminders earlier can improve on-time adherence.'
            : 'Your timing profile is stable. Keep the current reminder cadence.';

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
                </div>

                <MissedDoseAlert adherencePercentage={stats.adherence || 0} onClose={() => {}} />

                {/* Native Dash Layout Mapping components natively styling tracking-theme.css */}
                <div id="tracking-dashboard-content" className="dashboard-grid bg-emerald-50 p-2 md:p-6 rounded-2xl">
                    <AdherenceSummary 
                        percentage={stats.adherence || 0}
                        daysLogged={stats.taken || 0}
                        streak={stats.total > 0 ? 3 : 0}
                        backendUrl={backendUrl}
                        patientId={userData._id}
                        reportFilename={`${userData?.name ? userData.name.replace(/\s+/g, '_') : 'Personal'}_Tracking_Report.pdf`}
                    />

                    <BmiTrackingTile patientId={userData._id} refreshTrigger={refreshKey} />

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
