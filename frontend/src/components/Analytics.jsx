import React, { useMemo, useState, useRef, useEffect, useContext } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AppContent } from '../context/AppContext';

const Analytics = ({ users = [], fetchUsers }) => {
    const { backendUrl } = useContext(AppContent);
    const [timeRange, setTimeRange] = useState('Monthly');
    const [isSyncing, setIsSyncing] = useState(false);
    const [trackingStats, setTrackingStats] = useState(null);
    const [deviceStats, setDeviceStats] = useState(null);
    const [feedbackStats, setFeedbackStats] = useState(null);
    const reportRef = useRef(null);

    const fetchTrackingStats = async () => {
        try {
            axios.defaults.withCredentials = true;
            const token = localStorage.getItem('med_app_auth_token') || '';
            const { data } = await axios.get(backendUrl + '/api/admin/tracking-stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setTrackingStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching tracking stats", error);
        }
    };

    const fetchDeviceStats = async () => {
        try {
            axios.defaults.withCredentials = true;
            const token = localStorage.getItem('med_app_auth_token') || '';
            const { data } = await axios.get(backendUrl + '/api/admin/device-stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setDeviceStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching device stats", error);
        }
    };

    const fetchFeedbackStats = async () => {
        try {
            axios.defaults.withCredentials = true;
            const token = localStorage.getItem('med_app_auth_token') || '';
            const { data } = await axios.get(backendUrl + '/api/admin/feedback-stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setFeedbackStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching feedback stats", error);
        }
    };

    useEffect(() => {
        fetchTrackingStats();
        fetchDeviceStats();
        fetchFeedbackStats();
    }, []);

    const handleRefresh = async () => {
        if (!fetchUsers) return;
        setIsSyncing(true);
        try {
            await fetchUsers();
            await fetchTrackingStats();
            await fetchDeviceStats();
            await fetchFeedbackStats();
            toast.success("Analytics data updated");
        } catch (error) {
            toast.error("Failed to sync data");
        } finally {
            setIsSyncing(false);
        }
    };

    const stats = useMemo(() => {
        const safeUsers = Array.isArray(users) ? users : [];
        
        const verified = safeUsers.filter(u => u.isAccountVerified).length;
        const pending = safeUsers.length - verified;
        const patientCount = safeUsers.filter(u => u.role === 'Patient').length;
        const caretakerCount = safeUsers.filter(u => u.role === 'Caretaker').length;
        
        const verificationRate = safeUsers.length > 0 
            ? ((verified / safeUsers.length) * 100).toFixed(1) 
            : 0;

        return { verified, pending, verificationRate, total: safeUsers.length, patientCount, caretakerCount };
    }, [users]);

    const growthData = useMemo(() => {
        const safeUsers = Array.isArray(users) ? users : [];
        const groups = {};
        
        safeUsers.forEach(user => {
            if (!user.createdAt) return; 
            const regDate = new Date(user.createdAt);
            let label;
            if (timeRange === 'Daily') {
                label = regDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else if (timeRange === 'Monthly') {
                label = regDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            } else {
                const oneJan = new Date(regDate.getFullYear(), 0, 1);
                const weekNum = Math.ceil((((regDate - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
                label = `Week ${weekNum} (${regDate.getFullYear()})`;
            }
            groups[label] = (groups[label] || 0) + 1;
        });
        return Object.keys(groups).map(key => ({ date: key, count: groups[key] }));
    }, [users, timeRange]);

    const pieData = [
        { name: 'Patients', value: stats.patientCount }, 
        { name: 'Caretakers', value: stats.caretakerCount }
    ];
    const COLORS = ['#059669', '#3b82f6'];

    const trackingPieData = useMemo(() => {
        if (!trackingStats) return [];
        return [
            { name: 'Taken', value: trackingStats.Taken },
            { name: 'Missed', value: trackingStats.Missed },
            { name: 'Skipped', value: trackingStats.Skipped },
            { name: 'Late', value: trackingStats.Late },
            { name: 'Pending', value: trackingStats.Pending }
        ].filter(item => item.value > 0);
    }, [trackingStats]);

    const TRACKING_COLORS = {
        Taken: '#10b981',
        Missed: '#f43f5e', 
        Skipped: '#f59e0b', 
        Late: '#3b82f6', 
        Pending: '#94a3b8' 
    };

    const devicePieData = useMemo(() => {
        if (!deviceStats) return [];
        return [
            { name: 'Claimed', value: deviceStats.claimed },
            { name: 'Pending', value: deviceStats.pending },
            { name: 'Expired', value: deviceStats.expired }
        ].filter(item => item.value > 0);
    }, [deviceStats]);

    const DEVICE_COLORS = {
        Claimed: '#10b981', 
        Pending: '#3b82f6', 
        Expired: '#f43f5e'  
    };

    const feedbackPieData = useMemo(() => {
        if (!feedbackStats) return [];
        return [
            { name: 'Bug Report', value: feedbackStats['Bug Report'] },
            { name: 'Feature Request', value: feedbackStats['Feature Request'] },
            { name: 'Improvement', value: feedbackStats['Improvement'] },
            { name: 'Complaint', value: feedbackStats['Complaint'] },
            { name: 'Praise', value: feedbackStats['Praise'] }
        ].filter(item => item.value > 0);
    }, [feedbackStats]);

    const FEEDBACK_COLORS = {
        'Bug Report': '#ef4444',     
        'Feature Request': '#3b82f6',
        'Improvement': '#8b5cf6',    
        'Complaint': '#f59e0b',      
        'Praise': '#10b981'     
    };

    return (
        <div className='space-y-6'>
            <div className='flex justify-end gap-3'>
                <button 
                    onClick={handleRefresh}
                    disabled={isSyncing}
                    className='flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all shadow-sm active:scale-95 disabled:opacity-50'
                >
                    <svg className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isSyncing ? "SYNCING..." : "REFRESH DATA"}
                </button>
            </div>

            <div ref={reportRef} className='space-y-8 animate-in fade-in duration-700 p-4 bg-white'>

                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                    <div className='bg-white p-5 rounded-2xl shadow-sm border border-emerald-50'>
                        <p className='text-gray-500 text-xs font-medium'>Total Users</p>
                        <h4 className='text-2xl font-bold text-emerald-900'>{stats.total}</h4>
                    </div>
                    <div className='bg-white p-5 rounded-2xl shadow-sm border border-emerald-50'>
                        <p className='text-gray-500 text-xs font-medium'>Patients</p>
                        <h4 className='text-2xl font-bold text-emerald-600'>{stats.patientCount}</h4>
                    </div>
                    <div className='bg-white p-5 rounded-2xl shadow-sm border border-emerald-50'>
                        <p className='text-gray-500 text-xs font-medium'>Caretakers</p>
                        <h4 className='text-2xl font-bold text-blue-600'>{stats.caretakerCount}</h4>
                    </div>
                    <div className='bg-white p-5 rounded-2xl shadow-sm border border-emerald-50'>
                        <p className='text-gray-500 text-xs font-medium'>Verification</p>
                        <h4 className='text-2xl font-bold text-amber-500'>{stats.verificationRate}%</h4>
                    </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>

                    <div className='bg-white p-8 rounded-2xl shadow-sm border border-emerald-50 h-[370px]'>
                        <h3 className='text-emerald-800 font-bold mb-4'>User Distribution</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>


                    <div className='bg-white p-6 rounded-2xl shadow-sm border border-emerald-50 h-[370px]'>
                        <div className='flex justify-between items-center mb-6'>
                            <h3 className='text-emerald-800 font-bold'>Registration Growth</h3>
                            <div className='flex bg-emerald-50 p-1 rounded-lg gap-1'>
                                {['Daily', 'Monthly', 'Yearly'].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${timeRange === range ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-600 hover:bg-emerald-100'}`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={growthData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0FDF4" />
                                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#F0FDF4' }} />
                                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className='bg-white p-6 rounded-2xl shadow-sm border border-emerald-50 h-[370px] lg:col-span-2 xl:col-span-1'>
                        <h3 className='text-emerald-800 font-bold mb-4'>Global Medication Adherence</h3>
                        {trackingStats ? (
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie data={trackingPieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {trackingPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={TRACKING_COLORS[entry.name] || '#ccc'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className='flex items-center justify-center h-full'>
                                <p className='text-gray-400 text-sm'>Loading tracking data...</p>
                            </div>
                        )}
                    </div>

                    <div className='bg-white p-6 rounded-2xl shadow-sm border border-emerald-50 h-[370px] lg:col-span-2 xl:col-span-1'>
                        <h3 className='text-emerald-800 font-bold mb-4'>Device Connections</h3>
                        {deviceStats ? (
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie data={devicePieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {devicePieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={DEVICE_COLORS[entry.name] || '#ccc'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className='flex items-center justify-center h-full'>
                                <p className='text-gray-400 text-sm'>Loading device data...</p>
                            </div>
                        )}
                    </div>

                    <div className='bg-white p-6 rounded-2xl shadow-sm border border-emerald-50 h-[370px] lg:col-span-2 xl:col-span-1'>
                        <h3 className='text-emerald-800 font-bold mb-4'>Feedback Distribution</h3>
                        {feedbackStats ? (
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie data={feedbackPieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {feedbackPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={FEEDBACK_COLORS[entry.name] || '#ccc'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className='flex items-center justify-center h-full'>
                                <p className='text-gray-400 text-sm'>Loading feedback data...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;