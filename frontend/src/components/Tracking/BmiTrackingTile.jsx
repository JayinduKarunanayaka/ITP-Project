import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContent } from '../../context/AppContext';

const BmiTrackingTile = ({ patientId, refreshTrigger }) => {
    const [latestBmi, setLatestBmi] = useState(null);
    const { backendUrl } = useContext(AppContent);

    const fetchBMI = async () => {
        try {
            const url = patientId 
                ? `${backendUrl}/api/bmi?patientId=${patientId}` 
                : `${backendUrl}/api/bmi`;
            const { data } = await axios.get(url, { withCredentials: true });
            
            if (data.success && data.bmis && data.bmis.length > 0) {
                setLatestBmi(data.bmis[data.bmis.length - 1]);
            } else {
                setLatestBmi(null);
            }
        } catch (error) {
            console.error("Error fetching BMI for tracking tile:", error.message);
        }
    };

    useEffect(() => {
        fetchBMI();
        
        // Listen for updates from PatientBMI component or dashboard triggers
        window.addEventListener('bmiUpdated', fetchBMI);
        
        return () => {
            window.removeEventListener('bmiUpdated', fetchBMI);
        };
    }, [backendUrl, patientId, refreshTrigger]);

    const getThemeColors = (status) => {
        switch (status) {
            case 'Normal': 
                return { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', value: 'text-emerald-700', circle: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-600' };
            case 'Underweight': 
                return { badge: 'bg-blue-100 text-blue-800 border-blue-300', value: 'text-blue-700', circle: 'bg-blue-50 border-blue-200', icon: 'text-blue-600' };
            case 'Overweight': 
                return { badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', value: 'text-yellow-700', circle: 'bg-yellow-50 border-yellow-200', icon: 'text-yellow-600' };
            case 'Obese': 
                return { badge: 'bg-red-100 text-red-800 border-red-300', value: 'text-red-700', circle: 'bg-red-50 border-red-200', icon: 'text-red-600' };
            default: 
                return { badge: 'bg-gray-100 text-gray-800 border-gray-300', value: 'text-emerald-900', circle: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-600' };
        }
    };

    const theme = getThemeColors(latestBmi?.status);

    return (
        <div className="card bmi-snapshot flex flex-col h-full w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 m-0">BMI Snapshot</h3>
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${theme.circle}`}>
                    <i className={`fa-solid fa-weight-scale ${theme.icon}`}></i>
                </div>
            </div>
            
            {latestBmi ? (
                <div className="flex flex-col flex-1 justify-center relative">
                    <div className="flex items-end gap-3 mb-2">
                        <span className={`text-6xl font-black leading-none ${theme.value}`}>{latestBmi.value}</span>
                        <div className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${theme.badge} mb-1 ml-auto`}>
                            {latestBmi.status}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Height</span>
                            <span className="text-xl font-bold text-gray-800">{latestBmi.height} <span className="text-xs font-normal text-gray-500">cm</span></span>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Weight</span>
                            <span className="text-xl font-bold text-gray-800">{latestBmi.weight} <span className="text-xs font-normal text-gray-500">kg</span></span>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 w-full text-right" style={{marginTop: 'auto'}}>
                        <span className="text-xs text-gray-400 font-medium">Dynamically Synced</span>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-6">
                    <i className="fa-solid fa-chart-line text-4xl text-gray-200 mb-3"></i>
                    <p className="font-medium text-gray-500 text-center">No recent records</p>
                    <p className="text-xs mt-1 text-gray-400 text-center px-4">Log BMI to see tracking data</p>
                </div>
            )}
        </div>
    );
};

export default BmiTrackingTile;
