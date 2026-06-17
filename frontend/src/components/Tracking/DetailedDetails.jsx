import React, { useEffect, useMemo, useState, useContext } from 'react';
import axios from 'axios';
import { AppContent } from '../../context/AppContext.jsx';

const readSavedSessionToken = () => {
    try {
        return window.localStorage.getItem('med_app_auth_token') || '';
    } catch {
        return '';
    }
};

const getDayKey = (value) => new Date(value).toISOString().slice(0, 10);

const DetailedDetails = ({ patientId, title = 'Monthly Historical Audit' }) => {
    const { backendUrl } = useContext(AppContent);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            if (!backendUrl || !patientId) return;
            setLoading(true);
            try {
                const token = readSavedSessionToken();
                const response = await axios.get(`${backendUrl}/api/tracking/history/${patientId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                if (response.data?.success) {
                    setLogs(response.data.data || []);
                }
            } catch (error) {
                console.error('Failed to load adherence history', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [backendUrl, patientId]);

    const filteredLogs = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return logs;
        return logs.filter((log) => {
            return [log.medicationName, log.status, log.note, log.scheduledTime]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term));
        });
    }, [logs, searchTerm]);

    const calendar = useMemo(() => {
        if (logs.length === 0) return [];
        const newest = [...logs].sort((a, b) => new Date(b.scheduledTime) - new Date(a.scheduledTime))[0];
        const focusDate = new Date(newest.scheduledTime);
        const year = focusDate.getFullYear();
        const month = focusDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const dayMap = new Map();

        logs.forEach((log) => {
            const key = getDayKey(log.scheduledTime);
            if (!dayMap.has(key)) {
                dayMap.set(key, []);
            }
            dayMap.get(key).push(log);
        });

        const days = [];
        for (let day = 1; day <= lastDay.getDate(); day += 1) {
            const date = new Date(year, month, day);
            const key = getDayKey(date);
            const dayLogs = dayMap.get(key) || [];
            const total = dayLogs.length;
            const successful = dayLogs.filter((log) => ['Taken', 'Late'].includes(log.status)).length;
            const score = total > 0 ? Math.round((successful / total) * 100) : null;
            days.push({
                label: day,
                key,
                score,
                total,
                taken: successful,
                missed: dayLogs.filter((log) => ['Missed', 'Skipped'].includes(log.status)).length,
            });
        }
        return days;
    }, [logs]);

    const medicationBreakdown = useMemo(() => {
        const map = new Map();
        logs.forEach((log) => {
            if (!log.medicationName) return;
            const item = map.get(log.medicationName) || { total: 0, successful: 0, missed: 0 };
            item.total += 1;
            if (['Taken', 'Late'].includes(log.status)) item.successful += 1;
            if (['Missed', 'Skipped'].includes(log.status)) item.missed += 1;
            map.set(log.medicationName, item);
        });
        return [...map.entries()].map(([name, value]) => ({
            name,
            successRate: value.total > 0 ? Math.round((value.successful / value.total) * 100) : 0,
            ...value,
        })).sort((a, b) => b.total - a.total);
    }, [logs]);

    return (
        <section className="card" style={{ gridColumn: '1 / -1', padding: 'var(--space-xl)' }}>
            <div className="card-header" style={{ marginBottom: 'var(--space-lg)' }}>
                <h2><i className="fa-solid fa-calendar-days icon-primary" style={{ marginRight: '1rem', display: 'inline-flex' }}></i> {title}</h2>
                <p style={{ color: 'var(--text-muted)' }}>Daily heatmap, prescription breakdown, and audit history.</p>
            </div>

            {loading ? (
                <div style={{ color: 'var(--primary-green)' }}>Loading historical audit...</div>
            ) : (
                <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
                    <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-md)', padding: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <h4 style={{ margin: 0 }}>Adherence Calendar</h4>
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search audit history..."
                                style={{ padding: '0.7rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', minWidth: '240px' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(38px, 1fr))', gap: '8px' }}>
                            {calendar.map((day) => {
                                const background = day.score === null ? '#f3f4f6' : day.score >= 85 ? '#d1fae5' : day.score >= 65 ? '#fed7aa' : '#ffe4e6';
                                const borderColor = day.score === null ? '#e5e7eb' : day.score >= 85 ? '#10b981' : day.score >= 65 ? '#f59e0b' : '#fb7185';
                                return (
                                    <div key={day.key} title={`${day.key} - ${day.score ?? 'No data'}%`} style={{ minHeight: '68px', borderRadius: '12px', border: `1px solid ${borderColor}`, background, padding: '8px', fontSize: '0.8rem' }}>
                                        <div style={{ fontWeight: 700 }}>{day.label}</div>
                                        <div style={{ marginTop: '8px', fontSize: '0.75rem' }}>{day.score === null ? 'No logs' : `${day.score}%`}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-md)' }}>
                        {medicationBreakdown.map((item) => (
                            <div key={item.name} style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-md)', padding: 'var(--space-md)' }}>
                                <h4 style={{ marginTop: 0 }}>{item.name}</h4>
                                <p style={{ margin: '0.35rem 0', color: 'var(--text-muted)' }}>Success rate: {item.successRate}%</p>
                                <p style={{ margin: '0.35rem 0' }}>Taken/Late: {item.successful}</p>
                                <p style={{ margin: '0.35rem 0' }}>Missed/Skipped: {item.missed}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-md)', padding: 'var(--space-md)', overflowX: 'auto' }}>
                        <h4 style={{ marginTop: 0 }}>Dose-Level Audit Table</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                                    <th style={{ padding: '0.75rem' }}>Date</th>
                                    <th style={{ padding: '0.75rem' }}>Medication</th>
                                    <th style={{ padding: '0.75rem' }}>Status</th>
                                    <th style={{ padding: '0.75rem' }}>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log) => {
                                    const dayScore = calendar.find((day) => day.key === getDayKey(log.scheduledTime))?.score;
                                    return (
                                        <tr key={log._id} style={{ borderBottom: '1px solid #eef2f7' }}>
                                            <td style={{ padding: '0.75rem' }}>{new Date(log.scheduledTime).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem' }}>{log.medicationName || 'Unknown Medication'}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{ padding: '0.3rem 0.65rem', borderRadius: '999px', background: log.status === 'Taken' || log.status === 'Late' ? '#d1fae5' : '#ffe4e6', color: log.status === 'Taken' || log.status === 'Late' ? '#065f46' : '#9f1239', fontWeight: 700 }}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>{log.note || '-'}</td>
                                            <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{dayScore === null ? 'No day score' : `Integrity ${dayScore}%`}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
};

export default DetailedDetails;