import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ReportExport from './ReportExport';

const weekLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AdherenceSummary = ({ percentage, daysLogged, streak, backendUrl, patientId, reportFilename }) => {
    const [offset, setOffset] = useState(283); // Total circumference initially hidden
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const params = useParams();
    const routePatientId = patientId || params.patientId;

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

        if (!isExpanded && !details && backendUrl && routePatientId) {
            setLoading(true);
            try {
                const token = window.localStorage.getItem('med_app_auth_token') || '';
                const { data } = await axios.get(`${backendUrl}/api/tracking/detailed-adherence/${routePatientId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                if (data.success) {
                    setDetails(data);
                }
            } catch (error) {
                console.error("Failed to dynamically load detailed adherence metrics", error);
            }
            setLoading(false);
        }
    };

    const trend = details?.trendVelocity;
    const criticalMedication = details?.criticalMedication;

    const riskHotspots = useMemo(() => {
        return (details?.riskHotspots || []).slice(0, 4);
    }, [details]);

    const weekdayDistribution = useMemo(() => {
        if (!details?.dailyRates?.length) return [];

        const totals = new Map(weekLabels.map((label) => [label, { label, total: 0, missed: 0 }]));

        details.dailyRates.forEach((day) => {
            const date = new Date(day.date);
            if (Number.isNaN(date.getTime())) return;
            const label = weekLabels[date.getDay()];
            const current = totals.get(label);
            if (!current) return;
            current.total += 1;
            current.missed += Math.max(0, 100 - Number(day.rate || 0));
        });

        return [...totals.values()].map((item) => ({
            ...item,
            failureRate: item.total > 0 ? Math.min(100, Math.round(item.missed / item.total)) : 0,
        }));
    }, [details]);

    const openAnalysis = async () => {
        setIsExpanded(true);
        setActiveTab('analysis');
        if (!details && backendUrl && routePatientId) {
            setLoading(true);
            try {
                const token = window.localStorage.getItem('med_app_auth_token') || '';
                const { data } = await axios.get(`${backendUrl}/api/tracking/detailed-adherence/${routePatientId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                if (data.success) setDetails(data);
            } catch (error) {
                console.error('Failed to dynamically load detailed adherence metrics', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const getStatusClass = (pct) => pct >= 85 ? 'excellent' : (pct >= 65 ? 'moderate' : 'poor');
    const getStatusText = (pct) => pct >= 85 ? 'Excellent' : (pct >= 65 ? 'Moderate' : 'Poor');

    const openAnalysisPage = () => {
        if (routePatientId && window.location.pathname.includes('/patient/')) {
            navigate(`/patient/${routePatientId}/tracking/analysis`);
            return;
        }
        navigate('/tracking/analysis');
    };

    return (
        <div className={`card adherence-summary ${isExpanded ? 'expanded' : ''}`} style={{ transition: 'max-height 0.4s ease-in-out' }}>
            <div className="card-header w-full flex justify-between items-center gap-4 group">
                <div className="flex items-center gap-3">
                    {isExpanded ? (
                        <button
                            type="button"
                            onClick={() => { setActiveTab('summary'); setIsExpanded(false); }}
                            className="h-10 w-10 rounded-full border border-emerald-100 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center justify-center"
                            aria-label="Back to summary"
                        >
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={openAnalysis}
                            className="h-10 w-10 rounded-full border border-emerald-100 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center justify-center"
                            aria-label="Open adherence analysis"
                        >
                            <i className="fa-solid fa-chart-line"></i>
                        </button>
                    )}
                    <div>
                        <h3 className="font-black text-gray-900 text-lg sm:text-xl">Adherence Analysis</h3>
                        <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Success rate and clinical detail</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={openAnalysisPage}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${isExpanded ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                >
                    {percentage >= 85 ? 'Open analysis page' : 'Review details'}
                </button>
            </div>

            <div className="flex flex-wrap gap-2 px-1 pb-5">
                <button
                    type="button"
                    onClick={() => setActiveTab('summary')}
                    className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] transition-colors ${activeTab === 'summary' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                >
                    Summary
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('analysis')}
                    className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] transition-colors ${activeTab === 'analysis' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                >
                    Review adherence
                </button>
            </div>

            {activeTab === 'summary' && (
                <div className="card-body circular-progress-container" onClick={handleExpand} role="button" tabIndex={0}>
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
            )}

            {activeTab === 'analysis' && (
                <div className="mt-6 pt-6 border-t border-emerald-100 w-full animate-fade-in text-left" onClick={e => e.stopPropagation()}>
                    {loading ? (
                        <div className="text-center py-8">
                            <i className="fa-solid fa-circle-notch fa-spin text-emerald-500 text-2xl"></i>
                        </div>
                    ) : details ? (
                        <div className="grid gap-8 lg:grid-cols-[minmax(0,2.1fr)_minmax(280px,0.9fr)]">
                            <div className="space-y-8 min-w-0">
                                <div className="grid gap-6 xl:grid-cols-3">
                                    <div className="xl:col-span-2 bg-white rounded-[1.75rem] border border-emerald-100 p-7 relative overflow-hidden shadow-sm">
                                        <div className="absolute -right-6 -top-6 text-8xl text-indigo-900 opacity-[0.03] pointer-events-none select-none">
                                            <i className="fa-solid fa-dna"></i>
                                        </div>
                                        <div className="flex items-start justify-between gap-5 mb-5">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.28em] text-gray-400 font-semibold">Behavioral Fingerprint</p>
                                                <h4 className="text-xl font-black text-gray-900 mt-2">AI insight from your pattern history</h4>
                                            </div>
                                            {trend && (
                                                <div className={`min-w-44 rounded-2xl px-5 py-4 text-right border ${trend.delta >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                                                    <p className="text-[10px] uppercase tracking-[0.28em] font-semibold">Trend Velocity</p>
                                                    <p className="text-2xl font-black mt-1">{trend.delta >= 0 ? '+' : ''}{trend.delta || 0}%</p>
                                                    <p className="text-xs font-semibold mt-1">{trend.label || 'Stable'}</p>
                                                </div>
                                            )}
                                        </div>

                                        <blockquote className="border-l-4 border-indigo-500 pl-6 py-3 text-lg sm:text-xl text-gray-600 italic leading-9">
                                            {details.behavioralFingerprint}
                                        </blockquote>
                                    </div>

                                    <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-[1.75rem] border border-emerald-100 p-7 shadow-sm flex flex-col justify-between gap-6">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.28em] text-gray-400 font-semibold">Report Export</p>
                                            <p className="text-xl font-black text-gray-900 mt-3">High-contrast clinical export</p>
                                            <p className="text-sm text-gray-600 mt-3 leading-7">Download a medical-grade PDF for sharing with healthcare providers.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={openAnalysisPage}
                                            className="rounded-2xl bg-indigo-600 text-white font-bold py-4 shadow-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            Open full analysis page
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-6 lg:grid-cols-2">
                                    <div className="bg-white rounded-[1.75rem] border border-emerald-100 p-7 shadow-sm">
                                        <div className="flex items-center justify-between gap-3 mb-6">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.28em] text-gray-400 font-semibold">Risk Hotspots</p>
                                                <h4 className="text-xl font-black text-gray-900 mt-2">Failure density by time of day</h4>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-4">
                                            {riskHotspots.map((hotspot) => {
                                                const severityClass = hotspot.missed === 0 ? 'bg-slate-50 text-slate-400 border-slate-200' : hotspot.missed <= 2 ? 'bg-orange-50 text-orange-500 border-orange-200' : 'bg-rose-50 text-rose-600 border-rose-200';
                                                return (
                                                    <div key={hotspot.label} className={`rounded-2xl border p-4 text-center ${severityClass}`}>
                                                        <div className="text-[10px] font-bold tracking-[0.28em] mb-4">{hotspot.label.toUpperCase()}</div>
                                                        <div className="text-3xl font-black leading-none">{hotspot.missed}</div>
                                                        <div className="text-[10px] font-bold tracking-[0.26em] mt-3">MISSES</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[1.75rem] border border-emerald-100 p-7 shadow-sm">
                                        <div className="flex items-center justify-between gap-3 mb-6">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.28em] text-gray-400 font-semibold">Day of Week Distribution</p>
                                                <h4 className="text-xl font-black text-gray-900 mt-2">Missed-dose pressure by weekday</h4>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-7 gap-3 items-end min-h-56">
                                            {weekdayDistribution.map((day) => (
                                                <div key={day.label} className="flex flex-col items-center gap-3">
                                                    <div className="relative w-full aspect-square rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden">
                                                        <div
                                                            className="absolute inset-x-0 bottom-0 bg-rose-400/20 transition-all"
                                                            style={{ height: `${Math.min(day.failureRate, 100)}%` }}
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center text-gray-900 font-black text-base sm:text-lg">
                                                            {day.failureRate}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] tracking-[0.22em] font-bold text-gray-500 text-center">{day.label.slice(0, 3).toUpperCase()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 lg:pt-1">
                                <div className="rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 p-7 shadow-sm">
                                    <p className="text-xs uppercase tracking-[0.28em] text-gray-400 font-semibold">Proactive Care & Suggestions</p>
                                    <h4 className="text-xl font-black text-gray-900 mt-2">Actionable next steps</h4>
                                    <div className="mt-5 space-y-4">
                                        {(details.clinicalAdvice || []).map((item) => (
                                            <div key={item} className="group flex items-start gap-4 rounded-2xl p-4 hover:bg-white/70 transition-colors">
                                                <div className="mt-0.5 h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <i className="fa-solid fa-lightbulb text-sm"></i>
                                                </div>
                                                <p className="text-sm text-gray-700 leading-7 flex-1">{item}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-emerald-100">
                                        <p className="text-[10px] uppercase tracking-[0.28em] text-gray-400 font-semibold">Most impacted medication</p>
                                        <p className="mt-3 text-base font-black text-rose-600 leading-7">
                                            {criticalMedication?.medicationName ? `${criticalMedication.medicationName} (${criticalMedication.missedCount} misses)` : 'No repeated failure pattern detected'}
                                        </p>
                                    </div>
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
