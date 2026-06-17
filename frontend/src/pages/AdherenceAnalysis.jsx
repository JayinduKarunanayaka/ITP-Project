import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AppContent } from '../context/AppContext.jsx';
import LoggedIn from '../components/loggedin.jsx';
import PatientSidebar from '../components/PatientSidebar.jsx';
import ReportExport from '../components/Tracking/ReportExport.jsx';

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

const weekLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const getDayKey = (value) => new Date(value).toISOString().slice(0, 10);

const getLocalDayKey = (date) => {
    const local = new Date(date);
    const year = local.getFullYear();
    const month = String(local.getMonth() + 1).padStart(2, '0');
    const day = String(local.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const AdherenceAnalysisContent = ({ backendUrl, patientId, labelName, onBack, reportFilename }) => {
    const [details, setDetails] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
    const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

    useEffect(() => {
        const fetchDetails = async () => {
            if (!backendUrl || !patientId) return;
            setLoading(true);
            try {
                const { data } = await axios.get(`${backendUrl}/api/tracking/detailed-adherence/${patientId}`, {
                    headers: getAuthHeaders(),
                });
                if (data.success) {
                    setDetails(data);
                }
            } catch (error) {
                console.error('Failed to load adherence analysis page', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchHistory = async () => {
            if (!backendUrl || !patientId) return;
            try {
                const { data } = await axios.get(`${backendUrl}/api/tracking/history/${patientId}`, {
                    headers: getAuthHeaders(),
                });
                if (data.success) {
                    setLogs(data.data || []);
                }
            } catch (error) {
                console.error('Failed to load adherence history', error);
            }
        };

        fetchDetails();
        fetchHistory();
    }, [backendUrl, patientId]);

    const trend = details?.trendVelocity;
    const criticalMedication = details?.criticalMedication;

    const riskHotspots = useMemo(() => {
        return (details?.riskHotspots || []).slice(0, 4);
    }, [details]);

    const selectedMonthLogs = useMemo(() => {
        const monthIndex = Number(selectedMonth) - 1;
        return logs.filter((log) => {
            const parsed = new Date(log.scheduledTime);
            return parsed.getMonth() === monthIndex && String(parsed.getFullYear()) === selectedYear;
        }).sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
    }, [logs, selectedMonth, selectedYear]);

    const monthSummary = useMemo(() => {
        const total = selectedMonthLogs.length;
        const taken = selectedMonthLogs.filter((log) => ['Taken', 'Late'].includes(log.status)).length;
        const missed = selectedMonthLogs.filter((log) => ['Missed', 'Skipped'].includes(log.status)).length;
        const rate = total > 0 ? Math.round((taken / total) * 100) : 0;
        return { total, taken, missed, rate };
    }, [selectedMonthLogs]);

    const calendarDays = useMemo(() => {
        const monthIndex = Number(selectedMonth) - 1;
        const year = Number(selectedYear);
        const firstDay = new Date(year, monthIndex, 1);
        const lastDay = new Date(year, monthIndex + 1, 0);
        const firstWeekday = firstDay.getDay();
        const cells = [];

        for (let i = 0; i < firstWeekday; i += 1) {
            cells.push({ key: `blank-${i}`, blank: true });
        }

        for (let day = 1; day <= lastDay.getDate(); day += 1) {
            const date = new Date(year, monthIndex, day);
            const key = getLocalDayKey(date);
            const dayLogs = selectedMonthLogs.filter((log) => getDayKey(log.scheduledTime) === key);
            const takenCount = dayLogs.filter((log) => ['Taken', 'Late'].includes(log.status)).length;
            const missedCount = dayLogs.filter((log) => ['Missed', 'Skipped'].includes(log.status)).length;
            const totalCount = dayLogs.length;
            const rate = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : null;
            cells.push({
                key,
                blank: false,
                date,
                day,
                rate,
                takenCount,
                missedCount,
                totalCount,
                logs: dayLogs,
            });
        }

        return cells;
    }, [selectedMonth, selectedYear, selectedMonthLogs]);

    const medicationAnalysis = useMemo(() => {
        const map = new Map();
        selectedMonthLogs.forEach((log) => {
            const name = log.medicationName || 'Unknown Medication';
            const current = map.get(name) || { name, total: 0, taken: 0, missed: 0 };
            current.total += 1;
            if (['Taken', 'Late'].includes(log.status)) current.taken += 1;
            if (['Missed', 'Skipped'].includes(log.status)) current.missed += 1;
            map.set(name, current);
        });

        return [...map.values()]
            .map((item) => ({
                ...item,
                rate: item.total > 0 ? Math.round((item.taken / item.total) * 100) : 0,
            }))
            .sort((a, b) => b.rate - a.rate || b.total - a.total);
    }, [selectedMonthLogs]);

    const auditRows = useMemo(() => {
        return [...selectedMonthLogs].slice(0, 12).map((log) => {
            const dayKey = getLocalDayKey(log.scheduledTime);
            const dayScore = calendarDays.find((day) => day.key === dayKey)?.rate;
            return {
                log,
                dayScore,
            };
        });
    }, [selectedMonthLogs, calendarDays]);

    const weekdayDistribution = useMemo(() => {
        const counts = new Map(weekLabels.map((label) => [label, 0]));
        selectedMonthLogs.forEach((log) => {
            const parsed = new Date(log.scheduledTime);
            const label = weekLabels[parsed.getDay()];
            counts.set(label, (counts.get(label) || 0) + (['Missed', 'Skipped'].includes(log.status) ? 1 : 0));
        });
        return [...counts.entries()].map(([label, value]) => ({ label, value }));
    }, [selectedMonthLogs]);

    const getSeverityClass = (missed) => {
        if (missed === 0) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (missed <= 2) return 'bg-amber-50 text-amber-600 border-amber-200';
        return 'bg-rose-50 text-rose-600 border-rose-200';
    };

    const pageContent = (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
            <div className="flex items-start justify-between gap-6 mb-8 lg:mb-10">
                <div className="flex items-start gap-4 max-w-4xl">
                    <button
                        type="button"
                        onClick={onBack}
                        className="shrink-0 h-11 w-11 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm"
                        aria-label="Go back"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">Monthly Adherence Details</h1>
                        <p className="text-slate-500 mt-2">Viewing comprehensive history for {labelName}</p>
                    </div>
                </div>

                {details?.trendVelocity && (
                    <div className={`min-w-56 rounded-[1.5rem] border px-6 py-5 text-right shadow-sm ${details.trendVelocity.delta >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                        <p className="text-[10px] uppercase tracking-[0.32em] font-semibold">Trend Velocity</p>
                        <p className="text-3xl font-black mt-3">{details.trendVelocity.delta >= 0 ? '+' : ''}{details.trendVelocity.delta || 0}%</p>
                        <p className="text-sm font-semibold mt-1">{details.trendVelocity.label || 'Stable'}</p>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="min-h-[50vh] flex items-center justify-center">
                    <div className="text-center">
                        <i className="fa-solid fa-circle-notch fa-spin text-emerald-600 text-3xl"></i>
                        <p className="mt-4 text-gray-500">Loading the full analysis...</p>
                    </div>
                </div>
            ) : details ? (
                <div className="space-y-8">
                    <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-sm">
                        <div>
                            <p className="text-sm font-semibold text-emerald-800">Month Performance</p>
                            <p className="text-sm text-emerald-700/80 mt-1">Overall adherence rate for {monthNames[Number(selectedMonth) - 1]} {selectedYear}.</p>
                        </div>
                        <div className="text-5xl sm:text-6xl font-black text-emerald-700 leading-none">{monthSummary.rate}<span className="text-2xl sm:text-3xl align-top">%</span></div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3 text-slate-700 font-semibold">
                            <i className="fa-regular fa-calendar text-emerald-600"></i>
                            <span className="uppercase text-xs tracking-[0.22em] text-slate-400">Select Report Period</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                {monthNames.map((month, index) => (
                                    <option key={month} value={String(index + 1).padStart(2, '0')}>{month}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                {[selectedYear, String(Number(selectedYear) - 1), String(Number(selectedYear) + 1)].map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
                        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Adherence Calendar</h2>
                                <p className="text-sm text-slate-500 mt-1">Daily consistency tracking</p>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-100 border border-emerald-200"></span>Excellent</span>
                                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-100 border border-amber-200"></span>Moderate</span>
                                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose-100 border border-rose-200"></span>Poor</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-3 text-center">
                            {weekLabels.map((label) => (
                                <div key={label} className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 py-2">{label.slice(0, 3)}</div>
                            ))}

                            {calendarDays.map((day) => {
                                if (day.blank) {
                                    return <div key={day.key} className="min-h-32 rounded-2xl bg-transparent" />;
                                }

                                const tone = day.rate === null ? 'bg-slate-50 border-slate-200 text-slate-400' : day.rate >= 85 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : day.rate >= 65 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-200 text-rose-700';

                                return (
                                    <div key={day.key} className={`min-h-32 rounded-2xl border p-4 text-left shadow-sm ${tone}`}>
                                        <div className="flex items-center justify-between text-[11px] font-black tracking-[0.22em] uppercase">
                                            <span>{day.date.getDate()}</span>
                                            <span>{day.rate === null ? '--' : `${day.rate}%`}</span>
                                        </div>
                                        <div className="mt-4 space-y-2 text-[11px] font-semibold text-slate-500">
                                            <div>{day.totalCount} logs</div>
                                            <div>{day.takenCount} taken</div>
                                        </div>
                                        {day.missedCount > 0 && (
                                            <div className="mt-3 inline-flex rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-600 border border-rose-100">
                                                {day.missedCount} missed
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] items-start">
                        <div className="rounded-[1.5rem] border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-slate-900">Per-Medication Analysis</h2>
                                <p className="text-sm text-slate-500 mt-1">Individual success rates for the selected period.</p>
                            </div>

                            {medicationAnalysis.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {medicationAnalysis.map((item) => (
                                        <div key={item.name} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.rate >= 85 ? 'bg-emerald-100 text-emerald-600' : item.rate >= 65 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                                    <i className="fa-solid fa-pills"></i>
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-slate-900 truncate">{item.name}</h3>
                                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mt-1">{item.taken}/{item.total} doses taken</p>
                                                </div>
                                            </div>
                                            <div className={`text-2xl sm:text-3xl font-black ${item.rate >= 85 ? 'text-emerald-600' : item.rate >= 65 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                {item.rate}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No medication data available for this month.</div>
                            )}
                        </div>

                        <div className="rounded-[1.5rem] border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
                            <h2 className="text-2xl font-black text-slate-900">Month Summary</h2>
                            <p className="text-sm text-slate-500 mt-1">Selected month adherence score and history breakdown.</p>

                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                                    <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-700 font-bold">Taken</p>
                                    <p className="text-3xl font-black text-emerald-700 mt-2">{monthSummary.taken}</p>
                                </div>
                                <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
                                    <p className="text-[10px] uppercase tracking-[0.22em] text-amber-700 font-bold">Missed</p>
                                    <p className="text-3xl font-black text-amber-700 mt-2">{monthSummary.missed}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-bold">Total</p>
                                    <p className="text-3xl font-black text-slate-900 mt-2">{monthSummary.total}</p>
                                </div>
                            </div>

                            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-bold">Daily consistency</p>
                                <div className="grid grid-cols-7 gap-2 mt-4 items-end min-h-44">
                                    {weekdayDistribution.map((day) => (
                                        <div key={day.label} className="flex flex-col items-center gap-2">
                                            <div className="relative w-full aspect-square rounded-2xl border border-slate-200 bg-white overflow-hidden">
                                                <div className="absolute inset-x-0 bottom-0 bg-rose-400/20" style={{ height: `${Math.min(day.value * 12, 100)}%` }} />
                                                <div className="absolute inset-0 flex items-center justify-center text-slate-900 font-black text-base">{day.value}</div>
                                            </div>
                                            <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-400">{day.label.slice(0, 3)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-100 bg-white p-6 sm:p-8 shadow-sm overflow-hidden">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Dose-Level Audit</h2>
                                <p className="text-sm text-slate-500 mt-1">Comprehensive historical log</p>
                            </div>
                            <p className="text-sm text-slate-500">Past month rate: <span className="font-bold text-emerald-700">{details.pastMonthRate}%</span></p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-y-3">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-[0.24em] text-slate-400 text-left">
                                        <th className="px-4 py-2">Date Reference</th>
                                        <th className="px-4 py-2">Summary</th>
                                        <th className="px-4 py-2">Medication Audit</th>
                                        <th className="px-4 py-2 text-right">Day Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditRows.map(({ log, dayScore }) => (
                                        <tr key={log._id} className="bg-slate-50/70 hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-4 rounded-l-2xl font-semibold text-slate-900 whitespace-nowrap">
                                                {new Date(log.scheduledTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-500">
                                                <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${['Taken', 'Late'].includes(log.status) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {['Taken', 'Late'].includes(log.status) ? 'Taken' : 'Missed'}
                                                </div>
                                                <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">Out of 3 scheduled</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${['Taken', 'Late'].includes(log.status) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        <i className={`fa-solid ${['Taken', 'Late'].includes(log.status) ? 'fa-check' : 'fa-xmark'}`}></i>
                                                        {log.medicationName || 'Unknown Medication'}
                                                    </span>
                                                    {log.note ? (
                                                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{log.note}</span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 rounded-r-2xl text-right font-black text-emerald-700 whitespace-nowrap">
                                                {dayScore === null ? '--' : `${dayScore}%`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] items-start">
                        <div className="bg-white rounded-[1.75rem] border border-emerald-100 p-8 relative overflow-hidden shadow-sm">
                            <div className="absolute -right-6 -top-6 text-9xl text-indigo-900 opacity-[0.03] pointer-events-none select-none">
                                <i className="fa-solid fa-dna"></i>
                            </div>
                            <p className="text-xs uppercase tracking-[0.28em] text-gray-400 font-semibold">Behavioral Fingerprint</p>
                            <blockquote className="mt-5 border-l-4 border-indigo-500 pl-6 py-4 text-lg sm:text-xl text-gray-600 italic leading-10">
                                {details.behavioralFingerprint}
                            </blockquote>
                            <p className="mt-6 text-sm text-gray-500 leading-7 max-w-2xl">This text summarizes the pattern most strongly linked to missed medication behavior.</p>

                            <div className="grid gap-6 lg:grid-cols-2 mt-8">
                                <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-6">
                                    <p className="text-xs uppercase tracking-[0.28em] text-gray-400 font-semibold">Risk Hotspots</p>
                                    <h4 className="text-lg font-black text-slate-900 mt-2">Time of day miss count</h4>
                                    <div className="grid grid-cols-4 gap-3 mt-5">
                                        {riskHotspots.map((hotspot) => (
                                            <div key={hotspot.label} className={`rounded-2xl border p-3 text-center min-h-28 flex flex-col justify-center ${getSeverityClass(hotspot.missed)}`}>
                                                <div className="text-[9px] font-bold tracking-[0.3em] mb-3">{hotspot.label.toUpperCase()}</div>
                                                <div className="text-2xl font-black leading-none">{hotspot.missed}</div>
                                                <div className="text-[9px] font-bold tracking-[0.24em] mt-2">MISSES</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-[1.5rem] border border-slate-100 bg-white p-6 shadow-sm">
                                    <p className="text-xs uppercase tracking-[0.28em] text-gray-400 font-semibold">Clinical Suggestions</p>
                                    <h4 className="text-lg font-black text-slate-900 mt-2">What to do next</h4>
                                    <div className="mt-5 space-y-4">
                                        {(details.clinicalAdvice || []).map((item) => (
                                            <div key={item} className="flex items-start gap-3 rounded-2xl p-3 bg-emerald-50/60 border border-emerald-100">
                                                <div className="mt-0.5 h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                                    <i className="fa-solid fa-lightbulb text-sm"></i>
                                                </div>
                                                <p className="text-sm text-gray-700 leading-6 flex-1">{item}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-emerald-100">
                                        <p className="text-[10px] uppercase tracking-[0.28em] text-gray-400 font-semibold">Most impacted medication</p>
                                        <p className="mt-2 text-base font-black text-rose-600">
                                            {criticalMedication?.medicationName ? `${criticalMedication.medicationName} (${criticalMedication.missedCount} misses)` : 'No repeated failure pattern detected'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <ReportExport
                            backendUrl={backendUrl}
                            userId={patientId}
                            title="Go To Report"
                            filename={reportFilename || 'Tracking_Report.pdf'}
                            variant="solid"
                        />
                    </div>
                </div>
            ) : (
                <div className="min-h-[50vh] flex items-center justify-center text-gray-500">No analysis data available.</div>
            )}
        </div>
    );

    if (onBack) {
        return pageContent;
    }

    return <LoggedIn>{pageContent}</LoggedIn>;
};

const AdherenceAnalysis = () => {
    const { backendUrl, userData } = useContext(AppContent);
    const navigate = useNavigate();
    const { patientId } = useParams();
    const activeId = patientId || userData?._id;
    const labelName = patientId ? `Behavioral Analytics — ${patientId}` : 'Behavioral Analytics';

    if (patientId) {
        return (
            <div className="flex min-h-screen bg-white">
                <PatientSidebar patientName={userData?.name} />
                <div className="flex-1 bg-emerald-50 overflow-y-auto">
                    <AdherenceAnalysisContent
                        backendUrl={backendUrl}
                        patientId={activeId}
                        labelName={labelName}
                        reportFilename={`${userData?.name ? userData.name.replace(/\s+/g, '_') : 'Patient'}_Tracking_Report.pdf`}
                        onBack={() => navigate(`/patient/${activeId}/tracking`)}
                    />
                </div>
            </div>
        );
    }

    return (
        <LoggedIn>
            <AdherenceAnalysisContent
                backendUrl={backendUrl}
                patientId={activeId}
                labelName="Behavioral Analytics"
                reportFilename={`${userData?.name ? userData.name.replace(/\s+/g, '_') : 'Personal'}_Tracking_Report.pdf`}
                onBack={() => navigate('/tracking')}
            />
        </LoggedIn>
    );
};

export default AdherenceAnalysis;