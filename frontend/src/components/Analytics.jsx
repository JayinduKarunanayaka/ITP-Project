import React, { useMemo, useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';

const Analytics = ({ patients, fetchPatients }) => {
    const [timeRange, setTimeRange] = useState('Monthly');
    const [isSyncing, setIsSyncing] = useState(false);
    const reportRef = useRef(null);

    // --- Refresh Logic ---
    const handleRefresh = async () => {
        if (!fetchPatients) return;
        setIsSyncing(true);
        try {
            await fetchPatients();
            toast.success("Analytics data updated");
        } catch (error) {
            toast.error("Failed to sync data");
        } finally {
            setIsSyncing(false);
        }
    };

    // Calculate General Stats
    const stats = useMemo(() => {
        const verified = patients.filter(p => p.isAccountVerified).length;
        const pending = patients.length - verified;
        const verificationRate = patients.length > 0 ? ((verified / patients.length) * 100).toFixed(1) : 0;
        return { verified, pending, verificationRate, total: patients.length };
    }, [patients]);

    //Process Growth Data
    const growthData = useMemo(() => {
        const groups = {};
        patients.forEach(patient => {
            if (!patient.createdAt) return; 
            const regDate = new Date(patient.createdAt);
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
    }, [patients, timeRange]);

    // PDF Download 
    const downloadAnalyticsPDF = async () => {
        const element = reportRef.current;
        if (!element) return;
        try {
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.width = '800px';
            container.style.backgroundColor = '#ffffff';
            container.style.padding = '40px';
            container.style.fontFamily = 'Arial, sans-serif';

            container.innerHTML = `
                <div style="color: #064e3b;">
                    <h1 style="font-size: 24px; margin-bottom: 5px;">System Analytics Report</h1>
                    <p style="font-size: 12px; color: #6b7280; margin-bottom: 30px;">
                        Generated: ${new Date().toLocaleString()} | Range: ${timeRange}
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px;">
                        <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px;">
                            <p style="font-size: 12px; color: #6b7280;">Total Patients</p>
                            <h2 style="font-size: 24px; margin: 0; color: #064e3b;">${stats.total}</h2>
                        </div>
                        <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px;">
                            <p style="font-size: 12px; color: #6b7280;">Verification Rate</p>
                            <h2 style="font-size: 24px; margin: 0; color: #059669;">${stats.verificationRate}%</h2>
                        </div>
                        <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px;">
                            <p style="font-size: 12px; color: #6b7280;">Pending Accounts</p>
                            <h2 style="font-size: 24px; margin: 0; color: #d97706;">${stats.pending}</h2>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(container);
            const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
            document.body.removeChild(container);
            pdf.save(`Analytics_Report_${timeRange}.pdf`);
        } catch (error) {
            console.error(error);
        }
    };

    const pieData = [{ name: 'Verified', value: stats.verified }, { name: 'Pending', value: stats.pending }];
    const COLORS = ['#059669', '#E5E7EB'];

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

                <button 
                    onClick={downloadAnalyticsPDF}
                    className='bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95'
                >
                    Download Visual Report (PDF)
                </button>
            </div>

            <div ref={reportRef} className='space-y-8 animate-in fade-in duration-700 p-4 bg-white'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <div className='bg-white p-6 rounded-2xl shadow-sm border border-emerald-50'>
                        <p className='text-gray-500 text-sm font-medium'>Total Patients</p>
                        <h4 className='text-3xl font-bold text-emerald-900'>{stats.total}</h4>
                    </div>
                    <div className='bg-white p-6 rounded-2xl shadow-sm border border-emerald-50'>
                        <p className='text-gray-500 text-sm font-medium'>Verification Rate</p>
                        <h4 className='text-3xl font-bold text-emerald-600'>{stats.verificationRate}%</h4>
                    </div>
                    <div className='bg-white p-6 rounded-2xl shadow-sm border border-emerald-50'>
                        <p className='text-gray-500 text-sm font-medium'>Pending Accounts</p>
                        <h4 className='text-3xl font-bold text-amber-500'>{stats.pending}</h4>
                    </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                    <div className='bg-white p-8 rounded-2xl shadow-sm border border-emerald-50 h-[370px]'>
                        <h3 className='text-emerald-800 font-bold mb-4'>Verification Status</h3>
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
                            <h3 className='text-emerald-800 font-bold'>User Growth</h3>
                            <div data-html2canvas-ignore="true" className='flex bg-emerald-50 p-1 rounded-lg gap-1'>
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
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} cursor={{ fill: '#F0FDF4' }} />
                                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;