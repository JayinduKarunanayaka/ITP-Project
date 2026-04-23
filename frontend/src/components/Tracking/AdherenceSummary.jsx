import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdherenceSummary = ({ percentage, daysLogged, streak, backendUrl, patientId }) => {
    const [offset, setOffset] = useState(283); // Total circumference initially hidden
    const [isExpanded, setIsExpanded] = useState(false);
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Animate the circle fill after component mounts
        const calculatedOffset = 283 - (283 * percentage) / 100;
        const timer = setTimeout(() => {
            setOffset(calculatedOffset);
        }, 100);
        return () => clearTimeout(timer);
    }, [percentage]);

    const handleExpand = async () => {
        setIsExpanded(!isExpanded);
        
        // Fetch only if expanding, data isn't cached, and we safely have IDs available
        if (!isExpanded && !details && backendUrl && patientId) {
            setLoading(true);
            try {
                const { data } = await axios.get(`${backendUrl}/api/tracking/detailed-adherence/${patientId}`, { withCredentials: true });
                if (data.success) {
                    setDetails(data);
                }
            } catch (error) {
                console.error("Failed to dynamically load detailed adherence metrics", error);
            }
            setLoading(false);
        }
    };

    const getStatusClass = (pct) => pct >= 85 ? 'excellent' : (pct >= 65 ? 'moderate' : 'poor');
    const getStatusText = (pct) => pct >= 85 ? 'Excellent' : (pct >= 65 ? 'Moderate' : 'Poor');

    return (
        <div 
            className={`card adherence-summary ${isExpanded ? 'expanded' : ''}`} 
            onClick={handleExpand} 
            style={{ cursor: 'pointer', transition: 'max-height 0.4s ease-in-out' }}
        >
            <div className="card-header w-full flex justify-between items-center group">
                <h3 className="group-hover:text-emerald-600 transition-colors">Monthly Adherence <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-xs ml-2 text-gray-400 group-hover:text-emerald-500`}></i></h3>
                <i className="fa-solid fa-heart-pulse icon-primary"></i>
            </div>
            <div className="card-body circular-progress-container">
                <div className="circular-progress">
                    <svg viewBox="0 0 100 100">
                        <circle className="bg-circle" cx="50" cy="50" r="45"></circle>
                        <circle
                            className="progress-circle"
                            cx="50" cy="50" r="45"
                            style={{ strokeDashoffset: offset }}
                        ></circle>
                    </svg>
                    <div className="progress-text">
                        <span className="percentage">{percentage}%</span>
                        <span className={`status-label ${getStatusClass(percentage)}`}>
                            {getStatusText(percentage)}
                        </span>
                    </div>
                </div>
                <div className="adherence-stats">
                    <div className="stat-item">
                        <span className="stat-value">{daysLogged}</span>
                        <span className="stat-label">Days Logged</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{streak}</span>
                        <span className="stat-label">Day Streak <i className="fa-solid fa-fire icon-accent"></i></span>
                    </div>
                </div>
            </div>

            {/* Expansive Detailed Adherence Pull-down strictly loading natively */}
            {isExpanded && (
                <div className="mt-6 pt-5 border-t border-emerald-100 w-full animate-fade-in text-left" onClick={e => e.stopPropagation()}>
                    <h4 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Detailed Analysis</h4>
                    
                    {loading ? (
                        <div className="text-center py-4">
                            <i className="fa-solid fa-circle-notch fa-spin text-emerald-500 text-2xl"></i>
                        </div>
                    ) : details ? (
                        <div className="flex flex-col gap-4">
                            <div className="bg-emerald-50/70 rounded-xl p-4 flex justify-between items-center border border-emerald-100">
                                <div>
                                    <span className="text-emerald-900 font-bold block text-sm">Past Month Rate</span>
                                    <span className="text-emerald-600 text-xs text-left block">Previous calendar period</span>
                                </div>
                                <span className="text-emerald-700 font-black text-2xl">{details.pastMonthRate}%</span>
                            </div>
                            
                            <div className="mt-2 text-left">
                                <span className="text-xs font-bold text-gray-400 mb-2 block uppercase">Current Month History</span>
                                <div className="max-h-48 overflow-y-auto pr-2 rounded sidebar-scroll">
                                    {details.dailyRates && details.dailyRates.length > 0 ? details.dailyRates.map((day, idx) => (
                                        <div key={idx} className="flex justify-between text-sm py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                                            <span className="text-gray-600 font-medium">{day.date}</span>
                                            <div className="flex gap-4 items-center">
                                                <span className="text-gray-400 text-xs">{day.taken}/{day.total} taken</span>
                                                <span className={`font-bold w-12 text-right ${day.rate >= 85 ? 'text-emerald-500' : (day.rate >= 60 ? 'text-yellow-500' : 'text-rose-500')}`}>
                                                    {day.rate}%
                                                </span>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">No records yet this month.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-rose-500 text-sm text-center">Data analysis unavailable.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdherenceSummary;
