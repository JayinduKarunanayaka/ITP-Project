import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContent } from '../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PatientBMI = ({ patientId }) => {
    const { backendUrl } = useContext(AppContent);
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [loading, setLoading] = useState(false);
    const [bmiHistory, setBmiHistory] = useState([]);
    const [editId, setEditId] = useState(null);

    const fetchBMI = async () => {
        try {
            const url = patientId 
                ? `${backendUrl}/api/bmi?patientId=${patientId}` 
                : `${backendUrl}/api/bmi`;
            const { data } = await axios.get(url, { withCredentials: true });
            if (data.success && data.bmis) {
                setBmiHistory(data.bmis);
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    useEffect(() => {
        fetchBMI();
    }, []);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        
        const h = Number(height);
        const w = Number(weight);
        
        if (!h || !w || h <= 0 || w <= 0) {
            toast.error('Height and weight must be positive numbers.');
            return;
        }

        try {
            setLoading(true);
            const payload = { height: h, weight: w };
            if (patientId) payload.patientId = patientId;

            let data;
            if (editId) {
                const response = await axios.put(`${backendUrl}/api/bmi/${editId}`, payload, { withCredentials: true });
                data = response.data;
            } else {
                const response = await axios.post(backendUrl + '/api/bmi', payload, { withCredentials: true });
                data = response.data;
            }

            if (data.success) {
                toast.success(data.message || (editId ? 'BMI updated' : 'BMI recorded'));
                setHeight('');
                setWeight('');
                setEditId(null);
                fetchBMI(); // Refresh data
                window.dispatchEvent(new Event('bmiUpdated')); // Notify other components
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (bmi) => {
        setHeight(bmi.height);
        setWeight(bmi.weight);
        setEditId(bmi._id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this BMI record?")) return;
        try {
            const { data } = await axios.delete(`${backendUrl}/api/bmi/${id}`, { withCredentials: true });
            if (data.success) {
                toast.success(data.message || "BMI deleted");
                if (editId === id) {
                    setEditId(null);
                    setHeight('');
                    setWeight('');
                }
                fetchBMI();
                window.dispatchEvent(new Event('bmiUpdated')); // Notify other components
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Normal': return 'text-emerald-600 bg-emerald-50';
            case 'Underweight': return 'text-blue-600 bg-blue-50';
            case 'Overweight': return 'text-yellow-600 bg-yellow-50';
            case 'Obese': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const latestBmi = bmiHistory.length > 0 ? bmiHistory[bmiHistory.length - 1] : null;

    const chartData = bmiHistory.map(b => ({
        date: new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        BMI: b.value
    }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                <h3 className="text-xl font-bold text-emerald-800 mb-4">{editId ? 'Edit BMI' : 'Calculate BMI'}</h3>
                <form onSubmit={onSubmitHandler} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                        <input type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} required className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. 175" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                        <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} required className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. 70" />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md">
                            {loading ? 'Saving...' : (editId ? 'Update BMI Record' : 'Save BMI Record')}
                        </button>
                        {editId && (
                            <button type="button" onClick={() => { setEditId(null); setHeight(''); setWeight(''); }} className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-all">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center min-h-[400px]">
                <h3 className="text-xl font-bold text-emerald-800 mb-6 w-full text-left">BMI Tracking</h3>
                {latestBmi ? (
                    <div className="w-full flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="text-left">
                                <p className="text-sm text-gray-500 font-medium mb-1">Latest BMI</p>
                                <div className="text-4xl font-black text-emerald-900">{latestBmi.value}</div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <div className={`inline-block px-3 py-1 mb-2 rounded-full font-bold text-sm ${getStatusColor(latestBmi.status)}`}>
                                    {latestBmi.status}
                                </div>
                                <div className="flex gap-3 mt-1">
                                    <button onClick={() => handleEdit(latestBmi)} className="text-xs text-emerald-600 hover:text-emerald-800 font-bold transition-colors">Edit</button>
                                    <button onClick={() => handleDelete(latestBmi._id)} className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors">Delete</button>
                                </div>
                            </div>
                        </div>
                        
                        {bmiHistory.length > 1 ? (
                            <div className="w-full h-64 mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                                        <YAxis domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                                            itemStyle={{ color: '#047857', fontWeight: 'bold' }}
                                        />
                                        <Line type="monotone" dataKey="BMI" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#047857', stroke: '#fff', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex-1 w-full flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6 mt-4">
                                <p className="text-sm text-gray-500 font-medium text-center">Add more weight/height records<br/>to generate your tracking chart.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 w-full flex flex-col items-center justify-center text-gray-400 py-12">
                        <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="font-medium text-gray-600">No BMI records found.</p>
                        <p className="text-sm mt-1 text-gray-500">Calculate your BMI to start tracking.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientBMI;
