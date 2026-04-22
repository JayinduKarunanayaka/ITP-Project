import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoggedIn from '../components/loggedin';
import { AppContent } from '../context/AppContext';

const Inventory = () => {
    const { userData, backendUrl } = useContext(AppContent);
    const navigate = useNavigate();
    const [medications, setMedications] = useState([]);

    useEffect(() => {
        const fetchMedications = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/medications`, { withCredentials: true });
                if (data.success && data.meds) {
                    setMedications(data.meds);
                }
            } catch (error) {
                console.error("Failed to fetch medications:", error.message);
            }
        };
        fetchMedications();
    }, [backendUrl]);

    // Calculate Near Expiring count
    const nearExpiringCount = medications.filter(med => {
        if (!med.expiryDate) return false;
        const expiry = new Date(med.expiryDate);
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
        return expiry > today && expiry <= nextMonth;
    }).length;

    return (
        <LoggedIn>
            <div className="max-w-6xl mx-auto w-full">
                <div className="mb-8 border-b border-emerald-100 pb-6">
                    <h1 className='text-3xl sm:text-4xl font-black text-emerald-900'>
                        Inventory
                    </h1>
                    <p className='text-emerald-700 mt-2 text-sm sm:text-base'>Manage your medication stock levels and tracking.</p>
                </div>

                {/* Alert Summary Section */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Alert Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <div className="bg-white border border-slate-100 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-slate-700 font-semibold text-sm">Near Expiring Medicines</h3>
                            <p className="text-4xl font-bold text-orange-500 my-2">{nearExpiringCount}</p>
                            <p className="text-slate-400 text-xs">Items expiring soon</p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white border border-slate-100 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-slate-700 font-semibold text-sm">Low Stock Medicines</h3>
                            <p className="text-4xl font-bold text-red-500 my-2">12</p>
                            <p className="text-slate-400 text-xs">Items running low</p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white border border-slate-100 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <h3 className="text-slate-700 font-semibold text-sm">Need to Refill</h3>
                            <p className="text-4xl font-bold text-blue-500 my-2">5</p>
                            <p className="text-slate-400 text-xs">Refill orders pending</p>
                        </div>
                    </div>
                </div>

                {/* Quick Access Section */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Access</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card 1 */}
                        <div
                            onClick={() => navigate('/inventory/medications')}
                            className="bg-white border border-slate-100 rounded-xl p-6 flex items-start shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex flex-shrink-0 items-center justify-center text-emerald-600 mr-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-slate-800 font-semibold text-base">Medication Details</h3>
                                <p className="text-slate-500 text-sm mt-1 leading-relaxed">View and manage all medication inventory, stock levels, and expiration dates</p>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div
                            onClick={() => navigate('/inventory/prescriptions')}
                            className="bg-white border border-slate-100 rounded-xl p-6 flex items-start shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex flex-shrink-0 items-center justify-center text-emerald-600 mr-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-slate-800 font-semibold text-base">Prescription Manager</h3>
                                <p className="text-slate-500 text-sm mt-1 leading-relaxed">Track prescriptions, refill requests, and patient medication orders</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LoggedIn>
    );
};

export default Inventory;
